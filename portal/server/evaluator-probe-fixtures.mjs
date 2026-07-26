#!/usr/bin/env node

import assert from 'node:assert/strict';

const markerPattern =
  /\b(?:SNIPPET_PLACEHOLDER_DO_NOT_LEAVE|AI-REVIEW-MARKER|AI-AGENT-MARKER|AI-DATA-MARKER|PR-AGENT-MARKER|AI-PR-EVIDENCE-MARKER|CODEX-AI-MARKER|COPILOT-AI-MARKER)\b/;

function pass(label) {
  return { status: 'pass', label, detail: 'ok' };
}

function fail(label) {
  return { status: 'fail', label, detail: 'no' };
}

function humanGatePassed(items) {
  const requiredLabels = new Set([
    'Task PR',
    'Human PR author',
    'Fresh collaborator approval',
    'Human merge actor',
    'Bot/agent actor scan',
  ]);
  const seen = new Set(items.map((item) => item.label));
  return [...requiredLabels].every((label) => seen.has(label)) && items.every((item) => item.status === 'pass');
}

function workflowProbe(text, requiredPatterns, forbiddenPatterns = []) {
  return requiredPatterns.every((pattern) => pattern.test(text)) &&
    forbiddenPatterns.every((pattern) => !pattern.test(text));
}

function committedEnvFiles(files) {
  return files.filter((file) => /(^|\/)\.env($|\.)/.test(file)).filter((file) => !/\.example$/i.test(file));
}

function isAgentInstructionFile(file) {
  const normalized = String(file || '').replace(/\\/g, '/');
  const basename = (normalized.split('/').pop() || '').toLowerCase();
  return (
    basename === 'agents.md' ||
    basename === 'agent.md' ||
    basename === 'pr-agent-notes.md' ||
    /^pr[-_]?agent.*\.md$/i.test(basename) ||
    /^agent[-_]?.*\.md$/i.test(basename) ||
    normalized.toLowerCase().includes('/pull_request_template/agents.md')
  );
}

function protectedAgentFiles(files) {
  return files.filter(isAgentInstructionFile);
}

function fixtureReadableDockerSupportFile(file) {
  return file === '.dockerignore' || file === 'Dockerfile' || file === 'team-site/.dockerignore' || file === 'team-site/Dockerfile';
}

function fixtureHasFile(ctx, predicate) {
  const match = (file) => (typeof predicate === 'string' ? file === predicate : predicate.test(file));
  return [...ctx.files.keys()].some(match) || (ctx.tree || []).some((item) => item.type === 'blob' && match(item.path));
}

function groupName(item) {
  const text = `${item.label} ${item.detail}`;
  if (/Task PR|Human PR author|Fresh collaborator approval|Human merge actor|Bot\/agent actor scan/i.test(text)) {
    return 'Human Workflow Gate';
  }
  if (/secret|AI marker|agent marker|raw|leak|exposure|unsafe/i.test(text)) {
    return 'Security / AI Marker / Secret Hygiene';
  }
  if (/live|health|status|DNS|domain|artifact|manifest|run|Actions/i.test(text)) {
    return 'Live / Artifact / Service Evidence';
  }
  return 'Task Implementation Checks';
}

const passingGate = [
  pass('Task PR'),
  pass('Human PR author'),
  pass('Fresh collaborator approval'),
  pass('Human merge actor'),
  pass('Bot/agent actor scan'),
];

assert.equal(humanGatePassed(passingGate), true, 'passing human gate allows technical checks');
assert.equal(humanGatePassed([...passingGate.slice(0, 3), fail('Human merge actor'), passingGate[4]]), false, 'failed human gate skips technical checks');
assert.equal(markerPattern.test('PR-AGENT-MARKER: participant must manually remove'), true, 'PR marker is detected');
assert.equal(markerPattern.test('clean participant evidence'), false, 'clean evidence is accepted');
assert.deepEqual(committedEnvFiles(['.env.local.example', 'team-site/.env.example']), [], 'env templates are allowed');
assert.deepEqual(committedEnvFiles(['.env.local.example', 'team-site/.env.production']), ['team-site/.env.production'], 'real env files are blocked');
assert.deepEqual(protectedAgentFiles(['AGENTS.md', 'team-site/src/AGENTS.md', '.github/PULL_REQUEST_TEMPLATE/pr-agent-notes.md']), ['AGENTS.md', 'team-site/src/AGENTS.md', '.github/PULL_REQUEST_TEMPLATE/pr-agent-notes.md'], 'agent instruction edits are protected');
assert.deepEqual(protectedAgentFiles(['team-site/src/App.tsx', 'SUBMISSION.md']), [], 'normal task files are not protected agent files');
assert.equal(fixtureReadableDockerSupportFile('team-site/.dockerignore'), true, 'team-site .dockerignore is indexed for T12 source probes');
assert.equal(
  fixtureHasFile({ files: new Map(), tree: [{ type: 'blob', path: 'team-site/.dockerignore' }] }, /(^|\/)\.dockerignore$/),
  true,
  'hasFile tree fallback finds team-site .dockerignore',
);

const ciWorkflow = `
on:
  pull_request:
  push:
    branches: [main]
jobs:
  build:
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
`;

assert.equal(
  workflowProbe(ciWorkflow, [/pull_request/i, /push:/i, /node-version:\s*20/i, /npm ci/i, /npm run build/i, /upload-artifact/i], [/pull_request_target/i]),
  true,
  'CI workflow hidden probe passes',
);
assert.equal(
  workflowProbe(ciWorkflow.replace('npm ci', 'npm install'), [/npm ci/i], [/npm install(?!\s+-g)/i]),
  false,
  'CI workflow hidden probe fails stale install mode',
);

const grouped = [
  ...passingGate,
  pass('Hidden probe: T06 CI gate structure'),
  pass('Secret pattern scan'),
  pass('CI artifact metadata'),
].reduce((map, item) => map.set(groupName(item), [...(map.get(groupName(item)) || []), item]), new Map());

assert.equal([...grouped.values()].flat().length, 8, 'grouped UI model keeps more than six items');

console.log('Evaluator probe fixture tests passed: 14');
