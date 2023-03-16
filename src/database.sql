CREATE DATABASE workout_tracker;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE
    user_ (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        username VARCHAR(50) UNIQUE NOT NULL,
        hashed_password VARCHAR(100) NOT NULL
    );

CREATE TABLE
    muscle_group_ (
        muscle_group_id INTEGER PRIMARY KEY,
        muscle_group_name VARCHAR(50) UNIQUE NOT NULL
    );

INSERT INTO
    muscle_group_ (muscle_group_name)
VALUES
    (1, 'Back'),
    (2, 'Chest'),
    (3, 'Legs'),
    (4, 'Shoulders'),
    (5, 'Arms'),
    (6, 'Calves'),
    (7, 'Forearms'),
    (8, 'Abs');

CREATE TABLE
    equipment_ (
        equipment_id INTEGER PRIMARY KEY,
        equipment_name VARCHAR(50) UNIQUE NOT NULL
    );

INSERT INTO
    equipment_ (equipment_name)
VALUES
    (1, 'Barbell'),
    (2, 'Dumbbell'),
    (3, 'Machine'),
    (4, 'Cable'),
    (5, 'Bodyweight'),
    (6, 'Kettlebell');

CREATE TABLE
    exercise_ (
        exercise_id SERIAL PRIMARY KEY,
        exercise_name VARCHAR(50) UNIQUE NOT NULL,
        muscle_group_id INTEGER NOT NULL,
        user_id UUID,
        CONSTRAINT fk_muscle_group_id FOREIGN KEY (m, m3uscle_group_id) REFERENCES muscle_group_ (muscle_group_id),
        CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user_ (user_id)
    );

CREATE TABLE
    exercise_equipment_link_ (
        exercise_equipment_link_id SERIAL PRIMARY KEY,
        exercise_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        CONSTRAINT fk_exercise_id FOREIGN KEY (exercise_id) REFERENCES exercise_ (exercise_id),
        CONSTRAINT fk_equipment_id FOREIGN KEY (equipment_id) REFERENCES equipment_ (equipment_id)
    );

-- INSERT INTO
--     exercise_ (exercise_name, exercise_sets, reps, user_id)
-- VALUES
--     ('Back Squat', 3, '[12, 12]', 'c7532a97-c93a-4145-a5c8-ceeeb5384545');