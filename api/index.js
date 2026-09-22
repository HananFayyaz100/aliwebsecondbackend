// Vercel serverless entry point.
// Vercel automatically turns any file inside /api into a serverless
// function. This file simply re-exports the existing Express app
// (from server.js) so every request gets routed through it.
module.exports = require("../server");
