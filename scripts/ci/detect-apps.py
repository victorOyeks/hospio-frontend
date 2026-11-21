#!/usr/bin/env python3
"""Picks the apps a deploy run builds, for .github/workflows/deploy-staging.yml and deploy-production.yml.

Reads (environment):
  DEPLOY_ENV     staging | production
  APPS_CONFIG    JSON object, app name -> that app's matrix values (kept in the workflow file)
  EVENT_NAME     github.event_name
  REQUESTED      workflow_dispatch input "apps": "all" or a comma list (hotel,admin,landing)
  BEFORE, SHA    the push range
  WORKFLOW_FILE  the calling workflow's path (a change to it deploys every app)
  GITHUB_EVENT_PATH, GITHUB_OUTPUT, GITHUB_STEP_SUMMARY  set by Actions
Writes outputs "matrix" (JSON list of the chosen apps' config objects, each with "app") and "apps" (comma list).

Rules for a push (see README "Deployment"):
  - [deploy-all] in any pushed commit message, the first push of the branch, or a base commit that is not in the history -> every app.
  - package.json, bun.lock, the workflow file, this script -> every app.
  - apps/<x>/** -> x.
  - packages/config/** -> every app. packages/<pkg>/ files outside src (package.json, tsconfig.json) -> every app importing @hospio/<pkg>.
  - packages/<pkg>/src/** -> only the apps whose import graph reaches the file (an app's own files, followed through
    @hospio/ui/*, @hospio/api/*, relative imports and CSS @import inside packages). Tailwind's @source scan of
    packages/ui/src is not followed: a ui file an app never imports only adds or drops unused classes in its CSS.
  - Never deploys: *.md, docs/**, test files (*.test.*, *.spec.*, __tests__/), *.tsbuildinfo, and code files whose
    change is comments/blank lines only (both versions compared with comments stripped).
  - Anything else (nginx/, scripts/vps/, editor settings, biome.json, ...) deploys nothing.
  - Staging only: landing never deploys on a push (one landing site, production's); only a manual run with
    apps=landing or apps=all builds it.
"""

import json
import os
import re
import subprocess
import sys

ZERO = "0" * 40
SCRIPT = "scripts/ci/detect-apps.py"
CODE_EXT = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css")
RESOLVE_EXT = ("", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".json",
               "/index.ts", "/index.tsx", "/index.js", "/index.jsx")
PKG_ALIAS = {"@hospio/ui": "packages/ui/src", "@hospio/api": "packages/api/src"}

IMPORT_RES = [
    re.compile(r"""\bfrom\s*['"]([^'"\n]+)['"]"""),
    re.compile(r"""\bimport\s*\(?\s*['"]([^'"\n]+)['"]"""),
    re.compile(r"""\brequire\s*\(\s*['"]([^'"\n]+)['"]"""),
    re.compile(r"""@(?:import|plugin|reference)\s+(?:url\()?\s*['"]([^'"\n]+)['"]"""),
]


def git(*args):
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True).stdout


def git_ok(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True).returncode == 0


def ls_files():
    return [f for f in git("ls-files").splitlines() if f]


# ---------- import graph ----------

def specs(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            text = fh.read()
    except OSError:
        return []
    out = []
    for rx in IMPORT_RES:
        out.extend(rx.findall(text))
    return out


def resolve(spec, from_file, app, files, dirs):
    """Returns ("file", path) | ("dir", path) | ("pkg", name) | None (an npm module or unresolvable outside packages)."""
    if spec.startswith("@/"):
        base = f"apps/{app}/src/{spec[2:]}" if from_file.startswith("apps/") else None
        if base is None:
            return None
    elif spec in PKG_ALIAS:
        return ("pkg", spec)
    elif any(spec.startswith(k + "/") for k in PKG_ALIAS):
        k = next(k for k in PKG_ALIAS if spec.startswith(k + "/"))
        base = PKG_ALIAS[k] + spec[len(k):]
    elif spec.startswith("."):
        base = os.path.normpath(os.path.join(os.path.dirname(from_file), spec))
    else:
        return None
    for ext in RESOLVE_EXT:
        if base + ext in files:
            return ("file", base + ext)
    if base.rstrip("/") in dirs:
        return ("dir", base.rstrip("/"))
    if base.startswith("packages/"):
        # A package path that names no tracked file: count the whole package as used rather than miss it.
        for k, v in PKG_ALIAS.items():
            if base.startswith(v):
                return ("pkg", k)
    return None


def app_usage(app, files, dirs):
    """Package files an app's build can reach, plus package dirs it scans whole and packages it names bare."""
    reached, whole_dirs, whole_pkgs = set(), set(), set()
    queue = [f for f in files if f.startswith(f"apps/{app}/") and f.endswith(CODE_EXT)]
    seen = set(queue)
    while queue:
        f = queue.pop()
        for s in specs(f):
            r = resolve(s, f, app, files, dirs)
            if r is None:
                continue
            kind, target = r
            if kind == "pkg":
                whole_pkgs.add(target)
            elif kind == "dir":
                if target.startswith("packages/"):
                    whole_dirs.add(target)
            elif target.startswith("packages/"):
                reached.add(target)
                if target not in seen and target.endswith(CODE_EXT):
                    seen.add(target)
                    queue.append(target)
    return reached, whole_dirs, whole_pkgs


def uses_pkg(usage, pkg_dir):
    reached, whole_dirs, whole_pkgs = usage
    alias = "@hospio/" + pkg_dir.split("/")[1]
    return (alias in whole_pkgs
            or any(f.startswith(pkg_dir + "/") for f in reached)
            or any(d == pkg_dir or d.startswith(pkg_dir + "/") or pkg_dir.startswith(d + "/") for d in whole_dirs))


def reaches(usage, path):
    reached, whole_dirs, whole_pkgs = usage
    pkg_dir = "/".join(path.split("/")[:2])
    alias = "@hospio/" + path.split("/")[1]
    return (path in reached or alias in whole_pkgs
            or any(path.startswith(d + "/") for d in whole_dirs))


# ---------- comment-only changes ----------

def strip_comments(text, css):
    out, i, n = [], 0, len(text)
    while i < n:
        c = text[i]
        two = text[i:i + 2]
        if two == "/*":
            j = text.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append("\n" * text.count("\n", i, j))
            i = j
        elif two == "//" and not css:
            j = text.find("\n", i)
            i = n if j < 0 else j
        elif c in "'\"`":
            j = i + 1
            while j < n and text[j] != c:
                if text[j] == "\\":
                    j += 1
                elif text[j] == "\n" and c != "`":
                    break
                j += 1
            out.append(text[i:j + 1])
            i = j + 1
        else:
            out.append(c)
            i += 1
    return [ln.strip() for ln in "".join(out).splitlines() if ln.strip()]


def comment_only(path, base, sha):
    if not path.endswith(CODE_EXT):
        return False
    try:
        old = git("show", f"{base}:{path}")
        new = git("show", f"{sha}:{path}")
    except subprocess.CalledProcessError:
        return False  # added or deleted
    css = path.endswith(".css")
    return strip_comments(old, css) == strip_comments(new, css)


def ignored(path):
    name = os.path.basename(path)
    return (path.endswith(".md") or path.startswith("docs/")
            or re.search(r"\.(test|spec)\.[cm]?[jt]sx?$", name) is not None
            or "/__tests__/" in "/" + path
            or path.endswith(".tsbuildinfo"))


# ---------- main ----------

def main():
    env = os.environ
    deploy_env = env["DEPLOY_ENV"]
    config = json.loads(env["APPS_CONFIG"])
    all_apps = list(config)
    event = env.get("EVENT_NAME", "")
    requested = (env.get("REQUESTED") or "").replace(" ", "")
    before, sha = env.get("BEFORE", ""), env.get("SHA", "HEAD")
    workflow_file = env.get("WORKFLOW_FILE", "")
    notes = []
    chosen = set()

    if event == "workflow_dispatch":
        if requested in ("", "all"):
            chosen = set(all_apps)
            notes.append("manual run, apps=all")
        else:
            want = [a for a in requested.split(",") if a]
            bad = [a for a in want if a not in config]
            if bad:
                print(f"::error::Unknown app(s) {','.join(bad)}; use all or a comma list of {','.join(all_apps)}")
                sys.exit(1)
            chosen = set(want)
            notes.append(f"manual run, apps={requested}")
    else:
        messages = []
        try:
            with open(env["GITHUB_EVENT_PATH"], encoding="utf-8") as fh:
                ev = json.load(fh)
            messages = [c.get("message", "") for c in ev.get("commits") or []]
            if ev.get("head_commit"):
                messages.append(ev["head_commit"].get("message", ""))
        except (KeyError, OSError, ValueError):
            pass
        if any("[deploy-all]" in m for m in messages):
            chosen = set(all_apps)
            notes.append("[deploy-all] in a commit message")
        elif not before or before == ZERO or not git_ok("cat-file", "-e", f"{before}^{{commit}}"):
            chosen = set(all_apps)
            notes.append(f"no usable base commit ({before or 'none'}), deploying every app")
        else:
            changed = [f for f in git("diff", "--name-only", before, sha).splitlines() if f]
            files = set(ls_files())
            dirs = {os.path.dirname(f) for f in files}
            for d in list(dirs):
                while d:
                    d = os.path.dirname(d)
                    dirs.add(d)
            usage = {}
            for f in changed:
                if ignored(f):
                    notes.append(f"skip {f} (docs/tests)")
                    continue
                if f in ("package.json", "bun.lock", workflow_file, SCRIPT):
                    chosen |= set(all_apps)
                    notes.append(f"{f} -> all")
                    continue
                parts = f.split("/")
                if parts[0] == "apps" and len(parts) > 2:
                    app = parts[1]
                    if app not in config:
                        notes.append(f"skip {f} (not a deployed app)")
                    elif comment_only(f, before, sha):
                        notes.append(f"skip {f} (comments only)")
                    else:
                        chosen.add(app)
                        notes.append(f"{f} -> {app}")
                    continue
                if parts[0] == "packages" and len(parts) > 2:
                    if comment_only(f, before, sha):
                        notes.append(f"skip {f} (comments only)")
                        continue
                    pkg_dir = "/".join(parts[:2])
                    for app in all_apps:
                        if app not in usage:
                            usage[app] = app_usage(app, files, dirs)
                    if parts[1] == "config":
                        hit = set(all_apps)
                    elif parts[2] == "src":
                        hit = {a for a in all_apps if reaches(usage[a], f)}
                    else:
                        hit = {a for a in all_apps if uses_pkg(usage[a], pkg_dir)}
                    chosen |= hit
                    notes.append(f"{f} -> {','.join(sorted(hit)) or 'no app imports it'}")
                    continue
                notes.append(f"skip {f} (not part of an app build)")

        if deploy_env == "staging" and "landing" in chosen:
            chosen.discard("landing")
            notes.append("landing: not deployed from a staging push (one landing site, production's); run this workflow by hand with apps=landing")

    picked = [a for a in all_apps if a in chosen]
    matrix = [dict(app=a, **config[a]) for a in picked]
    summary = f"Apps to deploy ({deploy_env}): {', '.join(picked) or 'none'}"
    print(summary)
    for n in notes:
        print("  " + n)
    if env.get("GITHUB_OUTPUT"):
        with open(env["GITHUB_OUTPUT"], "a", encoding="utf-8") as fh:
            fh.write(f"matrix={json.dumps(matrix, separators=(',', ':'))}\n")
            fh.write(f"apps={','.join(picked)}\n")
    if env.get("GITHUB_STEP_SUMMARY"):
        with open(env["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as fh:
            fh.write(f"### {summary}\n\n" + "".join(f"- {n}\n" for n in notes))


if __name__ == "__main__":
    main()
