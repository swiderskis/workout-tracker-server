import { Response, Router } from "express";
import authentication from "../middleware/authentication";
import RequestWithPayload from "../interfaces/RequestWithPayload";
import pool from "../database";
import checkEmptyFields from "../middleware/checkEmptyFields";

const session = Router();

interface SessionDetails {
  name: string;
  date: string;
  exercises: SessionExercise[];
}

interface SessionExercise {
  exerciseEquipmentLinkId: number;
  exerciseName: string;
  equipmentId: number;
  weight: number[];
  reps: number[];
}

// Gets default workout data for selected day in session
session.get(
  "/workout/:date",
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    try {
      const userId = req.userId;
      const date = new Date(req.params.date);

      const response: SessionDetails = {
        name: "",
        date: req.params.date,
        exercises: [],
      };

      let routineId = -1;

      // Find the id of the current active routine
      const routines = await pool.query(
        "SELECT workout_routine_id, TO_CHAR(start_date, 'yyyy-mm-dd') AS start_date, TO_CHAR(end_date, 'yyyy-mm-dd') AS end_date FROM workout_routine_ WHERE user_id = $1",
        [userId]
      );

      routines.rows.forEach((element) => {
        const startDate = new Date(element.start_date);
        const endDate = new Date(element.end_date);

        if (date > startDate && date < endDate) {
          routineId = element.workout_routine_id;
        }
      });

      if (routineId === -1) {
        return res.status(400).json("No active routine found");
      }

      const activeRoutineId = routineId;

      // Find the relevant workout based on the session date
      // getUTCDay() gives Sunday = 0, enum day has Monday = 0 - need to convert
      let day = date.getUTCDay();
      day === 0 ? (day = 6) : day--;

      const enumDay = day;

      const workout = await pool.query(
        "SELECT workout_id, workout_name FROM workout_ WHERE workout_routine_id = $1 AND day_id = $2",
        [activeRoutineId, enumDay]
      );

      const workoutId = workout.rows[0].workout_id;

      response.name = workout.rows[0].workout_name;

      // Find exercise details for the workout
      const exercises = await pool.query(
        "SELECT exercise_equipment_link_id, sets, reps FROM workout_exercise_ WHERE workout_id = $1",
        [workoutId]
      );

      if (exercises.rows.length === 0) {
        return res
          .status(400)
          .json("This day in your routine has no exercises");
      }

      for (let i = 0; i < exercises.rows.length; i++) {
        const linkId = exercises.rows[i].exercise_equipment_link_id;
        const sets = exercises.rows[i].sets;
        const reps = exercises.rows[i].reps;

        const exerciseDetails = await pool.query(
          "SELECT exercise_id, equipment_id FROM exercise_equipment_link_ WHERE exercise_equipment_link_id = $1",
          [linkId]
        );

        const exerciseId = exerciseDetails.rows[0].exercise_id;
        const equipmentId = exerciseDetails.rows[0].equipment_id;

        const exerciseNameQuery = await pool.query(
          "SELECT exercise_name FROM exercise_ WHERE exercise_id = $1",
          [exerciseId]
        );

        const exerciseName = exerciseNameQuery.rows[0].exercise_name;

        const weightArray = [];
        const repsArray = [];

        for (let j = 0; j < sets; j++) {
          weightArray.push(0);
          repsArray.push(reps);
        }

        const sessionExercise: SessionExercise = {
          exerciseEquipmentLinkId: linkId,
          exerciseName: exerciseName,
          equipmentId: equipmentId,
          weight: weightArray,
          reps: repsArray,
        };

        response.exercises.push(sessionExercise);
      }

      return res.json(response);
    } catch (err: unknown) {
      console.log(err);
      return res.status(500).json("Server error");
    }
  }
);

// Adds details of session to database
session.post(
  "/log",
  authentication,
  checkEmptyFields,
  async (req: RequestWithPayload, res: Response) => {
    try {
      const userId = req.userId;

      const session: SessionDetails = req.body;

      // Insert session details
      const sessionInsert = await pool.query(
        "INSERT INTO session_ (session_name, session_date, user_id) VALUES ($1, $2, $3) RETURNING session_id",
        [session.name, session.date, userId]
      );

      const sessionId = sessionInsert.rows[0].session_id;

      // Insert exercise details
      for (let i = 0; i < session.exercises.length; i++) {
        const exerciseName = session.exercises[i].exerciseName;

        const exerciseInsert = await pool.query(
          "INSERT INTO session_exercise_ (exercise_name, session_id) VALUES ($1, $2) RETURNING session_exercise_id",
          [exerciseName, sessionId]
        );

        const sessionExerciseId = exerciseInsert.rows[0].session_exercise_id;

        for (let j = 0; j < session.exercises[i].weight.length; j++) {
          const weight = session.exercises[i].weight[j];
          const reps = session.exercises[i].reps[j];

          await pool.query(
            "INSERT INTO session_exercise_details_ (weight, reps, session_exercise_id) VALUES ($1, $2, $3)",
            [weight, reps, sessionExerciseId]
          );
        }
      }

      return res.json("Session details inserted");
    } catch (err: unknown) {
      console.log(err);
      return res.status(500).json("Server error");
    }
  }
);

export default session;
