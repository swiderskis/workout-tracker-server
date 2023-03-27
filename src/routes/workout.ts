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

workout.post(
  "/add",
  checkEmptyFields,
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const userId = req.userId;

    const { workoutName, workoutDay, workoutExercises } = req.body;

    try {
      const addWorkout = await pool.query(
        "INSERT INTO workout_ (workout_name, day_id, user_id) VALUES ($1, $2, $3) RETURNING *",
        [workoutName, workoutDay, userId]
      );

      for (let i = 0; i < workoutExercises.length; i++) {
        await pool.query(
          "INSERT INTO workout_exercise_ (exercise_equipment_link_id, sets, reps, workout_id) VALUES ($1, $2, $3, $4)",
          [
            workoutExercises[i].exerciseEquipmentLinkId,
            workoutExercises[i].sets,
            workoutExercises[i].reps,
            addWorkout.rows[0].workout_id,
          ]
        );
      }

      return res.json("Exercise" + addWorkout.rows[0].workout_name + "added");
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

export default workout;
