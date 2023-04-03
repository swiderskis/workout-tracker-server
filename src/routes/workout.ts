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

export default workout;
