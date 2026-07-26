// AI-REVIEW-MARKER: participant must manually remove this marker
const emailStatus = {
  task: 'T16',
  provider: 'resend',
  configured: Boolean(process.env.RESEND_API_KEY),
  secretRedacted: true,
};

console.log("Resend Email Alert Status:", JSON.stringify(emailStatus, null, 2));
