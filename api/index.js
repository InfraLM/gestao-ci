// Vercel Serverless Entry Point
// Routes /api/* requests to the Express app

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const app = require('../backend/src/app');

export default app;
