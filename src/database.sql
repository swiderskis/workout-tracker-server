CREATE DATABASE workout_tracker;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE user_ (
    user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(100) NOT NULL
);