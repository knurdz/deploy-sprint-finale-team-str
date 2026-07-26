export function taskNumber(taskId) {
  return String(taskId || '').toUpperCase();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function pullMatchesTask(pull, taskId) {
  const id = escapeRegExp(taskNumber(taskId));
  const title = String(pull.title || '');
  const branch = String(pull.head?.ref || '');
  return new RegExp(`^\\s*\\[${id}\\](?:\\s|:|-|$)`, 'i').test(title) ||
    new RegExp(`^task/${id}(?:-|$)`, 'i').test(branch);
}

function pullSortTime(pull) {
  const timestamp = pull.merged_at || pull.updated_at || pull.created_at || '';
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

function selectionReason(pull, taskId, defaultBranch, matchCount) {
  const id = taskNumber(taskId);
  const merged = Boolean(pull.merged_at);
  const target = pull.base?.ref || '<unknown>';
  const branch = pull.head?.ref || '<unknown>';
  const basis = merged ? `newest merged ${id} PR` : `newest unmerged ${id} PR`;
  const targetNote = target === defaultBranch ? `targeting ${defaultBranch}` : `targeting ${target}`;
  return `Selected PR #${pull.number} from ${branch} as the ${basis} ${targetNote}. Matched ${matchCount} task PR candidate(s).`;
}

export function selectTaskPull(pulls, taskId, defaultBranch = 'main') {
  const matches = pulls.filter((pull) => pullMatchesTask(pull, taskId));
  const sorted = [...matches].sort((a, b) => {
    const aDefault = a.base?.ref === defaultBranch ? 1 : 0;
    const bDefault = b.base?.ref === defaultBranch ? 1 : 0;
    if (aDefault !== bDefault) {
      return bDefault - aDefault;
    }

    const aMerged = a.merged_at ? 1 : 0;
    const bMerged = b.merged_at ? 1 : 0;
    if (aMerged !== bMerged) {
      return bMerged - aMerged;
    }

    const timeDiff = pullSortTime(b) - pullSortTime(a);
    if (timeDiff !== 0) {
      return timeDiff;
    }

    return Number(b.number || 0) - Number(a.number || 0);
  });
  const pull = sorted[0] || null;
  const id = taskNumber(taskId);
  return {
    pull,
    matchCount: matches.length,
    reason: pull
      ? selectionReason(pull, id, defaultBranch, matches.length)
      : `No PR title starting with [${id}] or branch starting with task/${id}- matched this task.`,
  };
}
