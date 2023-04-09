import { Router, Request, Response } from "express";
import { hash, compare } from "bcrypt";
import pool from "../database";
import generateToken from "../utils/generateToken";
import authentication from "../middleware/authentication";
import checkEmptyFields from "../middleware/checkEmptyFields";
import registerDetailsValidation from "../middleware/registerDetailsValidation";

const loginRegister = Router();

// Registers a new user
loginRegister.post(
  "/register",
  checkEmptyFields,
  registerDetailsValidation,
  async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const costFactor = 10;
      const hashedPassword = await hash(password, costFactor);

      // Checks if username in use
      const usernameExists = await pool.query(
        "SELECT username FROM user_ WHERE username = $1",
        [username]
      );

      if (usernameExists.rowCount !== 0)
        return res
          .status(409)
          .json(
            "An account with this username already exists, please try again"
          );

      // Inserts new user into table
      const registerUser = await pool.query(
        "INSERT INTO user_ (username, hashed_password) VALUES ($1, $2) RETURNING *",
        [username, hashedPassword]
      );

      return res.json("User " + registerUser.rows[0].username + " registered");
    } catch (err: unknown) {
      return res.status(500).json("Server error");
    }
  }
);

// Gets login details
loginRegister.post(
  "/login",
  checkEmptyFields,
  async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const userDetails = await pool.query(
        "SELECT * FROM user_ WHERE username = $1",
        [username]
      );

      // Check if username exists
      if (userDetails.rowCount === 0)
        return res
          .status(401)
          .json("A user with this username does not exist, please try again");

      const passwordMatch = await compare(
        password,
        userDetails.rows[0].hashed_password
      );

      if (!passwordMatch)
        return res.status(401).json("Incorrect password, please try again");

      const token = generateToken(userDetails.rows[0].user_id);

      return res.json(token);
    } catch (err: unknown) {
      console.log(err);

      return res.status(500).json("Server error");
    }
  }
);

// Authenticates user token
loginRegister.get(
  "/authenticate",
  authentication,
  async (_req: Request, res: Response) => {
    try {
      return res.json("User authenticated");
    } catch (err: unknown) {
      console.log(err);

      return res.status(500).json("Server error");
    }
  }
);

export default loginRegister;
