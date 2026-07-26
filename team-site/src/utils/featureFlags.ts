// AI-AGENT-MARKER: participant must manually remove this marker
export function featureFlags() {
  const hasProcess = typeof process !== 'undefined' && process.env;
  return {
    task: 'T15',
    showInsights: (hasProcess ? process.env.FEATURE_SHOW_INSIGHTS : '') === 'true',
    valueRedacted: true,
  };
}
