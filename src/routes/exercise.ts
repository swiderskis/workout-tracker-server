import { Response, Router } from "express";
import pool from "../database";
import RequestWithPayload from "../interfaces/RequestWithPayload";
import authentication from "../middleware/authentication";
import checkEmptyFields from "../middleware/checkEmptyFields";

const exercise = Router();

interface ExerciseListInfo {
  exerciseId: number;
  exerciseName: string;
  muscleGroupId: number;
}

interface ExerciseInformation extends ExerciseListInfo {
  equipmentIds: number[];
}

// Add new exercise
exercise.post(
  "/add",
  checkEmptyFields,
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const { exerciseName, muscleGroupSelection, equipmentSelection } = req.body;
    const userId = req.userId;

    try {
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

      return res.json("Exercise" + exerciseName + "added");
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
        "SELECT exercise_id, exercise_name, muscle_group_id FROM exercise_ WHERE user_id = $1 ORDER BY exercise_id",
        [userId]
      );

      const response: ExerciseListInfo[] = [];

      exerciseList.rows.forEach((element) => {
        const responseElement = <ExerciseListInfo>{};

        responseElement.exerciseId = element.exercise_id;
        responseElement.exerciseName = element.exercise_name;
        responseElement.muscleGroupId = element.muscle_group_id;

        response.push(responseElement);
      });

      return res.json(response);
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

// Gets exercise information for a given exercise id
exercise.get(
  "/view/:id",
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const userId = req.userId;
    const exerciseId = Number(req.params.id);

    try {
      // Ensure user accessing exercise info matches the user that added the exercise
      const exerciseUserIdRes = await pool.query(
        "SELECT user_id FROM exercise_ WHERE exercise_id = $1",
        [exerciseId]
      );

      if (exerciseUserIdRes.rows.length === 0)
        return res.status(400).json("This exercise no longer exists");

      const exerciseUserId = exerciseUserIdRes.rows[0].user_id;

      if (userId !== exerciseUserId)
        return res
          .status(403)
          .json("You are not permitted to view or edit this exercise");

      // Get info for exercise
      const exerciseInfo = await pool.query(
        "SELECT exercise_name, muscle_group_id FROM exercise_ WHERE exercise_id = $1",
        [exerciseId]
      );

      const exerciseName = exerciseInfo.rows[0].exercise_name;
      const muscleGroupId = exerciseInfo.rows[0].muscle_group_id;
      const equipmentIds = [];

      const equipmentIdsRows = await pool.query(
        "SELECT equipment_id FROM exercise_equipment_link_ WHERE exercise_id = $1",
        [exerciseId]
      );

      equipmentIdsRows.rows.forEach((element) =>
        equipmentIds.push(element.equipment_id)
      );

      const response: ExerciseInformation = {
        exerciseId,
        exerciseName,
        muscleGroupId,
        equipmentIds,
      };

      return res.json(response);
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

// Updates exercise information for a given exercise id
exercise.put(
  "/update/:id",
  checkEmptyFields,
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const exerciseId = Number(req.params.id);
    const { exerciseName, muscleGroupSelection, equipmentSelection } = req.body;

    try {
      await pool.query(
        "UPDATE exercise_ SET (exercise_name, muscle_group_id) = ($1, $2) WHERE exercise_id = $3",
        [exerciseName, muscleGroupSelection, exerciseId]
      );

      // Gets current equipment selection
      const currEquipmentSelectionRows = await pool.query(
        "SELECT equipment_id FROM exercise_equipment_link_ WHERE exercise_id = $1",
        [exerciseId]
      );

      const currEquipmentSelection = [];

      currEquipmentSelectionRows.rows.forEach((element) =>
        currEquipmentSelection.push(element.equipment_id)
      );

      // Compares current and new equipment selection, inserts and deletes rows based on changes
      const equipmentSelectionAdd = [];
      const equipmentSelectionRemove = [];

      equipmentSelection.filter((element: number) =>
        currEquipmentSelection.includes(element)
          ? null
          : equipmentSelectionAdd.push(element)
      );

      currEquipmentSelection.filter((element) =>
        equipmentSelection.includes(element)
          ? null
          : equipmentSelectionRemove.push(element)
      );

      equipmentSelectionAdd.forEach(
        async (element) =>
          await pool.query(
            "INSERT INTO exercise_equipment_link_ (exercise_id, equipment_id) VALUES ($1, $2)",
            [exerciseId, element]
          )
      );

      equipmentSelectionRemove.forEach(
        async (element) =>
          await pool.query(
            "DELETE FROM exercise_equipment_link_ WHERE exercise_id = $1 AND equipment_id = $2",
            [exerciseId, element]
          )
      );

      return res.json("Exercise" + exerciseName + "updated");
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

// Deletes data about an exercise for a given exercise id
exercise.delete(
  "/delete/:id",
  authentication,
  async (req: RequestWithPayload, res: Response) => {
    const exerciseId = Number(req.params.id);

    try {
      const exerciseExists = await pool.query(
        "SELECT exercise_id FROM exercise_ WHERE exercise_id = $1",
        [exerciseId]
      );

      if (exerciseExists.rows.length === 0)
        return res.status(400).json("This exercise no longer exists");

      await pool.query(
        "DELETE FROM exercise_equipment_link_ WHERE exercise_id = $1",
        [exerciseId]
      );

      const deletedExercise = await pool.query(
        "DELETE FROM exercise_ WHERE exercise_id = $1 RETURNING *",
        [exerciseId]
      );

      return res.json(
        "Exercise" + deletedExercise.rows[0].exercise_name + "deleted"
      );
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

export default exercise;
