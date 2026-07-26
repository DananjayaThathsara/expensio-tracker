import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, 'schema.sql'), 'utf8');

const run = async () => {
  await pool.query(sql);
  console.log('Schema applied.');
  await pool.end();
};

run().catch(err => { console.error(err); process.exit(1); });
