# Deploy Sprint Finale Team Repository

This is your team's private Deploy Sprint finale repository.

## What To Work On

- `team-site/` is the website your team will modify and deploy.
- The live finalist dashboard at `https://deploysprint.knurdz.org/finale/dashboard` shows launched tasks, credential packs, snippets, checks, and submission status.
- Use one branch and one pull request per task where practical.
- Every scored task requires a merged PR into `main`, an approving review from another team collaborator after the final commit, and a merge by a human team member.

## Local Development

Run the website locally from `team-site/`:

```bash
cd team-site
npm ci
npm run dev
npm run build
```

The deploy artifact is `team-site/dist/`.

Root convenience scripts are also available:

```bash
npm run dev
npm run build
npm run lint
```

## Rules Reminder

- Do not request, create, commit, or print VPS SSH private keys.
- Deployment must happen through GitHub Actions and approved deployment automation.
- Do not commit real secrets, API keys, tokens, `.env` files, or screenshots containing credentials.
- AI tools may be used for learning and drafting, but task commits, pushes, approvals, and merges must be done by real team-member GitHub accounts.
- Do not edit assistant instruction files such as `AGENTS.md` or PR-agent notes unless organizers explicitly instruct you.

## Submission

Keep `SUBMISSION.md` updated with public evidence only. The dashboard evaluator is the source of truth for automated checks and scoring.
