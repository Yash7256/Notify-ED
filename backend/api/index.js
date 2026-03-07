// Export the Express app directly so Vercel's Node runtime can treat it as
// a standard request handler. Wrapping with serverless-http isn't needed on
// Vercel and can cause invocation errors.
const app = require('../src/index');

module.exports = (req, res) => app(req, res);
