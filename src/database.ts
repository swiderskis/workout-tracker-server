import * as dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  user: process.env.PSQL_USERNAME,
  password: process.env.PSQL_PASSWORD,
  host: process.env.PSQL_HOST,
  port: Number(process.env.PSQL_PORT),
  database: process.env.PSQL_DATABASE,
});

export default pool;
