# GitHub Pages Workflow Fix

The workflow in `.github/workflows/pages.yml` is intentionally incomplete.
Update it so the dashboard can be built and deployed from `main` using GitHub
Pages.

Your fixed workflow should:

- Run when changes are pushed to `main`.
- Allow a manual run from the Actions tab.
- Use read-only content permissions unless deployment needs a more specific
  permission.
- Install dependencies with `npm ci`.
- Build the app with `npm run build`.
- Upload the Vite `dist` folder as the Pages artifact.
- Deploy the uploaded artifact to GitHub Pages.

Do not add repository secrets or personal tokens. The workflow should rely on
GitHub Pages and the default GitHub Actions token permissions only.
