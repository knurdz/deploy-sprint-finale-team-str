#!/usr/bin/env node

import assert from 'node:assert/strict';
import { pullMatchesTask, selectTaskPull } from './pr-selection.mjs';

const defaultPatterns = [
  'bot',
  'github-actions[bot]',
  'dependabot[bot]',
  'renovate[bot]',
  'copilot',
  'cursor',
  'codex',
  'claude',
  'anthropic',
  'openai',
  'gemini',
  'devin',
  'windsurf',
  'aider',
  'tabnine',
  'cody',
  'sourcegraph',
  'continue',
  'replit',
  'amazon-q',
  'qodo',
  'jules',
  'agent',
];
const collaborators = new Set(['alice', 'bob', 'carol']);
const latestCommitDate = '2026-07-25T09:00:00.000Z';
const markerPattern =
  /\b(?:SNIPPET_PLACEHOLDER_DO_NOT_LEAVE|AI-REVIEW-MARKER|AI-AGENT-MARKER|AI-DATA-MARKER|PR-AGENT-MARKER|AI-PR-EVIDENCE-MARKER|CODEX-AI-MARKER|COPILOT-AI-MARKER)\b/;

function actor(login, type = 'User') {
  return { login, type };
}

function disallowed(actorValue) {
  const login = String(actorValue?.login || '').toLowerCase();
  const type = String(actorValue?.type || '').toLowerCase();
  return type === 'bot' || type === 'app' || defaultPatterns.some((pattern) => login.includes(pattern));
}

function hasDisallowedCommitTrailer(commit) {
  return String(commit.message || '')
    .split(/\r?\n/)
    .filter((line) => /^co-authored-by:/i.test(line))
    .some((line) => defaultPatterns.some((pattern) => line.toLowerCase().includes(pattern)));
}

function isCollaborator(actorValue) {
  return collaborators.has(String(actorValue?.login || '').toLowerCase());
}

function evaluateGate({ pull, reviews = [], commits = [], collaboratorsReadable = true }) {
  if (!pull) {
    return 'failed';
  }
  if (!collaboratorsReadable) {
    return 'manual_review';
  }
  if (pull.base !== 'main' || !pull.merged) {
    return 'failed';
  }
  if (!isCollaborator(pull.author) || disallowed(pull.author)) {
    return 'failed';
  }
  if (!isCollaborator(pull.mergedBy) || disallowed(pull.mergedBy)) {
    return 'failed';
  }
  if ([pull.author, pull.mergedBy, ...reviews.map((review) => review.user), ...commits.flatMap((commit) => [commit.author, commit.committer])].some(disallowed)) {
    return 'failed';
  }
  if (commits.some(hasDisallowedCommitTrailer)) {
    return 'failed';
  }

  const latestCommit = Math.max(...commits.map((commit) => Date.parse(commit.date)), 0);
  const approved = reviews.some((review) => (
    review.state === 'APPROVED' &&
    review.user.login !== pull.author.login &&
    isCollaborator(review.user) &&
    !disallowed(review.user) &&
    Date.parse(review.submittedAt) >= latestCommit
  ));

  return approved ? 'passed' : 'failed';
}

function evaluateSnippet(source) {
  if (markerPattern.test(source)) {
    return 'failed';
  }
  return /T11|ReleaseReadiness|feature-bundle/.test(source) ? 'passed' : 'failed';
}

const validPull = {
  base: 'main',
  merged: true,
  author: actor('alice'),
  mergedBy: actor('carol'),
};
const validReview = { state: 'APPROVED', user: actor('bob'), submittedAt: '2026-07-25T09:05:00.000Z' };
const validCommit = { author: actor('alice'), committer: actor('alice'), date: latestCommitDate, message: '[T07] Add feature' };

const cases = [
  ['pass', 'passed', { pull: validPull, reviews: [validReview], commits: [validCommit] }],
  ['no PR', 'failed', { pull: null }],
  ['unmerged PR', 'failed', { pull: { ...validPull, merged: false }, reviews: [validReview], commits: [validCommit] }],
  ['self review', 'failed', { pull: validPull, reviews: [{ ...validReview, user: actor('alice') }], commits: [validCommit] }],
  ['stale approval', 'failed', { pull: validPull, reviews: [{ ...validReview, submittedAt: '2026-07-25T08:55:00.000Z' }], commits: [validCommit] }],
  ['bot merge', 'failed', { pull: { ...validPull, mergedBy: actor('github-actions[bot]', 'Bot') }, reviews: [validReview], commits: [validCommit] }],
  ['non-collaborator reviewer', 'failed', { pull: validPull, reviews: [{ ...validReview, user: actor('mallory') }], commits: [validCommit] }],
  ['bot commit actor', 'failed', { pull: validPull, reviews: [validReview], commits: [{ ...validCommit, committer: actor('deploy-agent') }] }],
  ['codex commit actor', 'failed', { pull: validPull, reviews: [validReview], commits: [{ ...validCommit, committer: actor('codex-cli') }] }],
  ['agent coauthor trailer', 'failed', { pull: validPull, reviews: [validReview], commits: [{ ...validCommit, message: '[T07] Add feature\n\nCo-authored-by: Cursor <cursoragent@example.test>' }] }],
  ['claude coauthor trailer', 'failed', { pull: validPull, reviews: [validReview], commits: [{ ...validCommit, message: '[T07] Add feature\n\nCo-authored-by: Claude <claude@example.test>' }] }],
  ['collaborators unreadable', 'manual_review', { pull: validPull, reviews: [validReview], commits: [validCommit], collaboratorsReadable: false }],
];

for (const [name, expected, fixture] of cases) {
  assert.equal(evaluateGate(fixture), expected, name);
}

assert.equal(evaluateSnippet('export const releaseReadinessTask = { task: "T11" };'), 'passed', 'modified snippet marker passes');
assert.equal(evaluateSnippet('export const x = "AI-REVIEW-MARKER:T11";'), 'failed', 'leftover marker fails');
assert.equal(evaluateSnippet('export const x = "PR-AGENT-MARKER:T11";'), 'failed', 'leftover PR agent marker fails');

const pull = (number, title, branch, target = 'main', mergedAt = null, updatedAt = '2026-07-25T10:00:00.000Z') => ({
  number,
  title,
  head: { ref: branch },
  base: { ref: target },
  merged_at: mergedAt,
  updated_at: updatedAt,
  created_at: updatedAt,
});

assert.equal(pullMatchesTask(pull(1, '[T07] Rebase Organizer Feature', 'feature/random'), 'T07'), true, 'strict task title matches');
assert.equal(pullMatchesTask(pull(2, 'Rebase T07 Organizer Feature', 'feature/random'), 'T07'), false, 'title mentioning task id later does not match');
assert.equal(pullMatchesTask(pull(3, 'Rebase Organizer Feature', 'task/T07-rebase-organizer-feature'), 'T07'), true, 'strict task branch matches');
assert.equal(pullMatchesTask(pull(4, '[T071] Wrong Task', 'task/T071-wrong'), 'T07'), false, 'similar task ids do not match');

assert.equal(
  selectTaskPull([
    pull(10, '[T07] Open retry', 'task/T07-open', 'main', null, '2026-07-25T11:00:00.000Z'),
    pull(9, '[T07] Merged scored work', 'task/T07-scored', 'main', '2026-07-25T10:00:00.000Z', '2026-07-25T10:00:00.000Z'),
  ], 'T07', 'main').pull.number,
  9,
  'merged task PR is preferred over newer unmerged task PR',
);
assert.equal(
  selectTaskPull([
    pull(11, '[T07] Older merged', 'task/T07-older', 'main', '2026-07-25T09:00:00.000Z'),
    pull(12, '[T07] Newer merged', 'task/T07-newer', 'main', '2026-07-25T12:00:00.000Z'),
  ], 'T07', 'main').pull.number,
  12,
  'newest merged task PR is selected',
);
assert.equal(
  selectTaskPull([
    pull(13, '[T07] Merged to release', 'task/T07-release', 'release', '2026-07-25T13:00:00.000Z'),
    pull(14, '[T07] Merged to main', 'task/T07-main', 'main', '2026-07-25T11:00:00.000Z'),
  ], 'T07', 'main').pull.number,
  14,
  'default branch task PR is preferred over non-default branch PR',
);
assert.equal(
  selectTaskPull([
    pull(15, '[T07] Open older', 'task/T07-open-older', 'main', null, '2026-07-25T08:00:00.000Z'),
    pull(16, '[T07] Open newer', 'task/T07-open-newer', 'main', null, '2026-07-25T09:00:00.000Z'),
  ], 'T07', 'main').pull.number,
  16,
  'newest unmerged task PR is selected when no merged task PR exists',
);
assert.equal(
  selectTaskPull([
    pull(17, '[T08] Different task', 'task/T08-conflict', 'main', '2026-07-25T10:00:00.000Z'),
    pull(18, 'Mentions T07 only', 'feature/T07-mention', 'main', '2026-07-25T10:00:00.000Z'),
  ], 'T07', 'main').pull,
  null,
  'unrelated task PRs and loose mentions are ignored',
);

console.log(`Human workflow fixture tests passed: ${cases.length + 12}`);
