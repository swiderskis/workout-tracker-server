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
    muscle_group_ (muscle_group_id, muscle_group_name)
VALUES
    (0, 'Back'),
    (1, 'Chest'),
    (2, 'Legs'),
    (3, 'Shoulders'),
    (4, 'Arms'),
    (5, 'Calves'),
    (6, 'Forearms'),
    (7, 'Abs');

CREATE TABLE
    equipment_ (
        equipment_id INTEGER PRIMARY KEY,
        equipment_name VARCHAR(50) UNIQUE NOT NULL
    );

INSERT INTO
    equipment_ (equipment_id, equipment_name)
VALUES
    (0, 'Barbell'),
    (1, 'Dumbbell'),
    (2, 'Machine'),
    (3, 'Cable'),
    (4, 'Bodyweight'),
    (5, 'Kettlebell');

CREATE TABLE
    exercise_ (
        exercise_id SERIAL PRIMARY KEY,
        exercise_name VARCHAR(50) UNIQUE NOT NULL,
        muscle_group_id INTEGER NOT NULL,
        user_id UUID,
        CONSTRAINT fk_muscle_group_id FOREIGN KEY (muscle_group_id) REFERENCES muscle_group_ (muscle_group_id),
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