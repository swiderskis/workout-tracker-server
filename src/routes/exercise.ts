import { Response, Router } from "express";
import pool from "../database";
import RequestWithPayload from "../interfaces/RequestWithPayload";
import authentication from "../middleware/authentication";
import checkEmptyFields from "../middleware/checkEmptyFields";

const exercise = Router();

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
      console.error(err);
      return res.status(500).json("Server error");
    }
  }
);

export default exercise;
