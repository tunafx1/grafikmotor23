import dotenv from 'dotenv';
import path from 'path';

// Automatically load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import app from './api/index';

export default app;

