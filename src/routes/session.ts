import { Request, Response, Router } from "express";
import authentication from "../middleware/authentication";
import pool from "../database";
import checkEmptyFields from "../middleware/checkEmptyFields";

const session = Router();

interface SessionDetails {
  name: string;
  date: string;
  exercises: SessionExercise[];
}

interface SessionExercise {
  id: number;
  exerciseName: string;
  equipmentId: number;
  weight: number[];
  reps: number[];
}

interface SessionList {
  sessionId: number;
  name: string;
  date: string;
}

// Gets default workout data for selected day in session
session.get(
  "/workout/:date",
  authentication,
  async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
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
          id: linkId,
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
  async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;

      const session: SessionDetails = req.body;

      // Check if existing session already exists on this date
      const existingSessionQuery = await pool.query(
        "SELECT * FROM session_ WHERE session_date = $1 AND user_id = $2",
        [session.date, userId]
      );

      if (existingSessionQuery.rows.length > 0) {
        return res.status(400).json("A session already exists for this date");
      }

      // Insert session details
      const sessionInsert = await pool.query(
        "INSERT INTO session_ (session_name, session_date, user_id) VALUES ($1, $2, $3) RETURNING session_id",
        [session.name, session.date, userId]
      );

      const sessionId = sessionInsert.rows[0].session_id;

      // Insert exercise details
      for (let i = 0; i < session.exercises.length; i++) {
        const exerciseName = session.exercises[i].exerciseName;
        const equipmentId = session.exercises[i].equipmentId;

        const exerciseInsert = await pool.query(
          "INSERT INTO session_exercise_ (exercise_name, equipment_id, session_id) VALUES ($1, $2, $3) RETURNING session_exercise_id",
          [exerciseName, equipmentId, sessionId]
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

session.get("/list", authentication, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;

    const sessionListQuery = await pool.query(
      "SELECT session_id, session_name, TO_CHAR(session_date, 'yyyy-mm-dd') as session_date FROM session_ WHERE user_id = $1 ORDER BY session_date DESC",
      [userId]
    );

    const response: SessionList[] = [];

    sessionListQuery.rows.forEach((element) => {
      const sessionId = element.session_id;
      const name = element.session_name;
      const date = element.session_date;

      const responseElement: SessionList = { sessionId, name, date };

      response.push(responseElement);
    });

    return res.json(response);
  } catch (err: unknown) {
    console.log(err);
    return res.status(500).json("Server error");
  }
});

session.get("/:id", authentication, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;
    const sessionId = req.params.id;

    // Get session name and date
    const sessionQuery = await pool.query(
      "SELECT session_name, TO_CHAR(session_date, 'yyyy-mm-dd') AS session_date, user_id FROM session_ WHERE session_id = $1",
      [sessionId]
    );

    // Check user editing session is also the one who made it
    const sessionUserId = sessionQuery.rows[0].user_id;
    const date = sessionQuery.rows[0].session_date;

    if (sessionUserId !== userId)
      return res
        .status(403)
        .json("You are not permitted to view or edit this session");

    const sessionName = sessionQuery.rows[0].session_name;

    const response: SessionDetails = {
      name: sessionName,
      date: date,
      exercises: [],
    };

    // Get exercise details
    const sessionExerciseQuery = await pool.query(
      "SELECT session_exercise_id, exercise_name, equipment_id FROM session_exercise_ WHERE session_id = $1",
      [sessionId]
    );

    for (let i = 0; i < sessionExerciseQuery.rows.length; i++) {
      const sessionExerciseId =
        sessionExerciseQuery.rows[i].session_exercise_id;
      const exerciseName = sessionExerciseQuery.rows[i].exercise_name;
      const equipmentId = sessionExerciseQuery.rows[i].equipment_id;

      const sessionExerciseDetailsQuery = await pool.query(
        "SELECT weight, reps FROM session_exercise_details_ WHERE session_exercise_id = $1",
        [sessionExerciseId]
      );

      const weightArray = [];
      const repsArray = [];

      for (let j = 0; j < sessionExerciseDetailsQuery.rows.length; j++) {
        const weight = sessionExerciseDetailsQuery.rows[j].weight;
        const reps = sessionExerciseDetailsQuery.rows[j].reps;

        weightArray.push(weight);
        repsArray.push(reps);
      }

      const responseExerciseElement: SessionExercise = {
        id: sessionExerciseId,
        exerciseName: exerciseName,
        weight: weightArray,
        reps: repsArray,
        equipmentId: equipmentId,
      };

      response.exercises.push(responseExerciseElement);
    }

    return res.json(response);
  } catch (err: unknown) {
    console.log(err);
    return res.status(500).json("Server error");
  }
});

session.put(
  "/:id",
  authentication,
  checkEmptyFields,
  async (req: Request, res: Response) => {
    try {
      const userId = res.locals.userId;
      const sessionId = req.params.id;

      const session: SessionDetails = req.body;

      // Check if existing session already exists on this date
      const existingSessionQuery = await pool.query(
        "SELECT * FROM session_ WHERE session_date = $1 AND user_id = $2 AND session_id != $3",
        [session.date, userId, sessionId]
      );

      if (existingSessionQuery.rows.length > 0) {
        return res.status(400).json("A session already exists for this date");
      }

      await pool.query(
        "UPDATE session_ SET (session_name, session_date) = ($1, $2) WHERE session_id = $3",
        [session.name, session.date, sessionId]
      );

      // Delete old session exercise details
      const sessionExerciseQuery = await pool.query(
        "SELECT session_exercise_id FROM session_exercise_ WHERE session_id = $1",
        [sessionId]
      );

      for (let i = 0; i < sessionExerciseQuery.rows.length; i++) {
        const sessionExerciseId =
          sessionExerciseQuery.rows[i].session_exercise_id;

        await pool.query(
          "DELETE FROM session_exercise_details_ WHERE session_exercise_id = $1",
          [sessionExerciseId]
        );

        await pool.query(
          "DELETE FROM session_exercise_ WHERE session_exercise_id = $1",
          [sessionExerciseId]
        );
      }

      // Insert new session exercise details
      for (let i = 0; i < session.exercises.length; i++) {
        const exerciseName = session.exercises[i].exerciseName;
        const equipmentId = session.exercises[i].equipmentId;

        const exerciseInsert = await pool.query(
          "INSERT INTO session_exercise_ (exercise_name, equipment_id, session_id) VALUES ($1, $2, $3) RETURNING session_exercise_id",
          [exerciseName, equipmentId, sessionId]
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

      return res.json(`Session ${sessionId} updated`);
    } catch (err: unknown) {
      console.log(err);
      return res.status(500).json("Server error");
    }
  }
);

export default session;
