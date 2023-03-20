import { Response, Router } from "express";
import pool from "../database";
import RequestWithPayload from "../interfaces/RequestWithPayload";
import authentication from "../middleware/authentication";
import checkEmptyFields from "../middleware/checkEmptyFields";

const exercise = Router();

interface ExerciseInformation {
  exerciseId: number;
  exerciseName: string;
  muscleGroupId: number;
  equipmentIds: number[];
}

// Add new exercise
exercise.post(
  "/add",
  checkEmptyFields,
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    try {
      const { exerciseName, muscleGroupSelection, equipmentSelection } =
        req.body;
      const userId = req.userId;

      const addExercise = await pool.query(
        "INSERT INTO exercise_ (exercise_name, muscle_group_id, user_id) VALUES ($1, $2, $3) RETURNING *",
        [exerciseName, muscleGroupSelection, userId]
      );

      equipmentSelection.forEach(async (element: number) => {
        await pool.query(
          "INSERT INTO exercise_equipment_link_ (exercise_id, equipment_id) VALUES ($1, $2) RETURNING *",
          [addExercise.rows[0].exercise_id, element]
        );
      });

      return res.status(200).json("Exercise added");
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

// Get list of exercises user has added
exercise.get(
  "/view",
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const userId = req.userId;

    try {
      // Get list of exercises for user, stores them as arrays
      const exerciseList = await pool.query(
        "SELECT exercise_id, exercise_name, muscle_group_id FROM exercise_ WHERE user_id = $1",
        [userId]
      );

      const exerciseIds = [];
      const exerciseNames = [];
      const muscleGroupIds = [];

      exerciseList.rows.forEach((index) => {
        exerciseIds.push(index.exercise_id);
        exerciseNames.push(index.exercise_name);
        muscleGroupIds.push(index.muscle_group_id);
      });

      const response: ExerciseInformation[] = [];

      for (let i = 0; i < exerciseIds.length; i++) {
        // Get array of equipment for each exercise
        const equipmentIds = await getEquipmentIds(exerciseIds[i]);

        // Assigns exercise and equipment information to response
        response.push({
          exerciseId: exerciseIds[i],
          exerciseName: exerciseNames[i],
          muscleGroupId: muscleGroupIds[i],
          equipmentIds: equipmentIds,
        });
      }

      return res.json(response);
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

// Gets equipmentIds for a given exerciseId
async function getEquipmentIds(exerciseId: number) {
  const equipmentIds = [];
  const equipmentIdsRows = await pool.query(
    "SELECT equipment_id FROM exercise_equipment_link_ WHERE exercise_id = $1",
    [exerciseId]
  );
  equipmentIdsRows.rows.forEach((index) =>
    equipmentIds.push(index.equipment_id)
  );

  return equipmentIds;
}

export default exercise;
