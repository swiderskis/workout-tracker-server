import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  password: "password",
  host: "localhost",
  port: 5432,
  database: "workout_tracker",
});

export default pool;
