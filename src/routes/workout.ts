import { Response, Router } from "express";
import pool from "../database";
import RequestWithPayload from "../interfaces/RequestWithPayload";
import authentication from "../middleware/authentication";
import checkEmptyFields from "../middleware/checkEmptyFields";

const workout = Router();

interface WorkoutExerciseInfo {
  exerciseId: number;
  exerciseName: string;
  muscleGroupId: number;
  exerciseEquipmentLinkIds: number[];
  equipmentIds: number[];
}

interface WorkoutExerciseSelection {
  exerciseId: number;
  exerciseName: string;
  muscleGroupId: number;
  sets: number;
  reps: number;
  exerciseEquipmentLinkId: number;
  equipmentId: number;
}

interface WorkoutRoutineDay {
  day: number;
  workoutName: string;
  workoutExercises: WorkoutExerciseSelection[];
}

interface WorkoutRoutine {
  startDate: Date;
  endDate: Date;
  workoutRoutineDays: WorkoutRoutineDay[];
}

interface RoutineDetails {
  routineId: number;
  startDate: Date;
  endDate: Date;
}

// Gets list of exercises user has added
workout.get(
  "/exercise-list",
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const userId = req.userId;

    try {
      // Gets exercise and muscle group ids
      const exerciseList = await pool.query(
        "SELECT exercise_id, exercise_name, muscle_group_id FROM exercise_ WHERE user_id = $1",
        [userId]
      );

      const response: WorkoutExerciseInfo[] = [];

      // Gets list of equipment exercise link and equipment ids for each exercise id
      for (let i = 0; i < exerciseList.rows.length; i++) {
        const exerciseId = exerciseList.rows[i].exercise_id;
        const exerciseName = exerciseList.rows[i].exercise_name;
        const muscleGroupId = exerciseList.rows[i].muscle_group_id;
        const exerciseEquipmentLinkIds = [];
        const equipmentIds = [];

        const equipmentList = await pool.query(
          "SELECT exercise_equipment_link_id, equipment_id FROM exercise_equipment_link_ WHERE exercise_id = $1 ORDER BY equipment_id",
          [exerciseId]
        );

        equipmentList.rows.forEach((element) => {
          exerciseEquipmentLinkIds.push(element.exercise_equipment_link_id);
          equipmentIds.push(element.equipment_id);
        });

        // Pushes all exercise info into response element
        const responseElement: WorkoutExerciseInfo = {
          exerciseId,
          exerciseName,
          muscleGroupId,
          exerciseEquipmentLinkIds,
          equipmentIds,
        };

        response.push(responseElement);
      }

      return res.json(response);
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

// Adds user created workout routine into database
workout.post(
  "/create-routine",
  checkEmptyFields,
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const userId = req.userId;
    const routine: WorkoutRoutine = req.body;

    try {
      // Inserts workout routine details into database
      const startDate = new Date(routine.startDate);
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1;
      const startDay = startDate.getDate();

      const endDate = new Date(routine.endDate);
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth() + 1;
      const endDay = endDate.getDate();

      const addRoutine = await pool.query(
        "INSERT INTO workout_routine_ (start_date, end_date, user_id) VALUES (make_date($1, $2, $3), make_date($4, $5, $6), $7) RETURNING *",
        [startYear, startMonth, startDay, endYear, endMonth, endDay, userId]
      );

      // Inserts workout details for each day into database
      for (let i = 0; i < routine.workoutRoutineDays.length; i++) {
        const { workoutName, day, workoutExercises } =
          routine.workoutRoutineDays[i];

        const addWorkout = await pool.query(
          "INSERT INTO workout_ (workout_name, day_id, workout_routine_id) VALUES ($1, $2, $3) RETURNING *",
          [workoutName, day, addRoutine.rows[0].workout_routine_id]
        );

        // Inserts exercise details for each workout into database
        for (let j = 0; j < workoutExercises.length; j++) {
          await pool.query(
            "INSERT INTO workout_exercise_ (exercise_equipment_link_id, sets, reps, workout_id) VALUES ($1, $2, $3, $4)",
            [
              workoutExercises[j].exerciseEquipmentLinkId,
              workoutExercises[j].sets,
              workoutExercises[j].reps,
              addWorkout.rows[0].workout_id,
            ]
          );
        }
      }
      return res.json("Routine added");
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

// Gets a list of routines
workout.get(
  "/routine-list",
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const userId = req.userId;

    try {
      const response: RoutineDetails[] = [];

      const routineList = await pool.query(
        "SELECT workout_routine_id, start_date, end_date FROM workout_routine_ WHERE user_id = $1",
        [userId]
      );

      routineList.rows.forEach((element) => {
        const routineId = element.workout_routine_id;
        const startDate = element.start_date;
        const endDate = element.end_date;

        const repsonseElement: RoutineDetails = {
          routineId,
          startDate,
          endDate,
        };

        response.push(repsonseElement);
      });

      return res.json(response);
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

// Gets details for a routine
workout.get(
  "/routine/:id",
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const userId = req.userId;
    const routineId = Number(req.params.id);

    try {
      // Get routinie start and end dates
      const routineDetails = await pool.query(
        "SELECT start_date, end_date, user_id FROM workout_routine_ WHERE workout_routine_id = $1",
        [routineId]
      );

      const startDate = new Date(routineDetails.rows[0].start_date);
      const endDate = new Date(routineDetails.rows[0].end_date);
      const exerciseUserId = routineDetails.rows[0].user_id;

      if (userId !== exerciseUserId)
        return res
          .status(403)
          .json("You are not permitted to view or edit this routine");

      // Initialise routine object to be sent in response
      const routine: WorkoutRoutine = {
        startDate: startDate,
        endDate: endDate,
        workoutRoutineDays: [],
      };

      // Get details for each workout day in the routine
      const routineWorkouts = await pool.query(
        "SELECT workout_id, workout_name, day_id FROM workout_ WHERE workout_routine_id = $1",
        [routineId]
      );

      for (let i = 0; i < routineWorkouts.rows.length; i++) {
        const workoutId = routineWorkouts.rows[i].workout_id;

        const day = routineWorkouts.rows[i].day_id;
        const workoutName = routineWorkouts.rows[i].workout_name;

        // Initialise workout object to be pushed to routine object
        const workout: WorkoutRoutineDay = {
          day: day,
          workoutName: workoutName,
          workoutExercises: [],
        };

        // Get details for each exercise in the workout day
        const workoutExercises = await pool.query(
          "SELECT exercise_equipment_link_id, sets, reps FROM workout_exercise_ WHERE workout_id = $1",
          [workoutId]
        );

        for (let j = 0; j < workoutExercises.rows.length; j++) {
          const exerciseEquipmentLinkId =
            workoutExercises.rows[j].exercise_equipment_link_id;
          const sets = workoutExercises.rows[j].sets;
          const reps = workoutExercises.rows[j].reps;

          const exerciseLink = await pool.query(
            "SELECT exercise_id, equipment_id FROM exercise_equipment_link_ WHERE exercise_equipment_link_id = $1",
            [exerciseEquipmentLinkId]
          );

          const exerciseId = exerciseLink.rows[0].exercise_id;
          const equipmentId = exerciseLink.rows[0].equipmentId;

          const exercise = await pool.query(
            "SELECT exercise_name, muscle_group_id FROM exercise_ WHERE exercise_id = $1",
            [exerciseId]
          );

          const exerciseName = exercise.rows[0].exercise_name;
          const muscleGroupId = exercise.rows[0].muscle_group_id;

          // Create exercise object to be pushed to workout object
          const workoutExercise: WorkoutExerciseSelection = {
            exerciseId,
            exerciseName,
            muscleGroupId,
            sets,
            reps,
            exerciseEquipmentLinkId,
            equipmentId,
          };

          workout.workoutExercises.push(workoutExercise);
        }

        routine.workoutRoutineDays.push(workout);
      }

      return res.json(routine);
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

export default workout;
