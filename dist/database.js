"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
require("dotenv").config();
const pool = new pg_1.Pool({
    user: process.env.PSQL_USERNAME,
    password: process.env.PSQL_PASSWORD,
    host: process.env.PSQL_HOST,
    port: Number(process.env.PSQL_PORT),
    database: process.env.PSQL_DATABASE,
});
exports.default = pool;
//# sourceMappingURL=database.js.map