# Redeploying the apps

Deploys run from `.github/workflows/deploy-staging.yml` (push to `staging`) and `deploy-production.yml` (push to `production`), one run per push, deploying only the apps the push changed (rules in the README, "Deployment"). An empty commit, or one touching only docs, tests or comments, deploys nothing.

- Redeploy every app: put `[deploy-all]` in the commit message (on staging this means hotel and admin; landing deploys on staging only by hand).
- Redeploy chosen apps: "Run workflow" on Deploy (staging) / Deploy (production) with `apps` = `all` or a comma list, e.g. `hotel,admin`.
