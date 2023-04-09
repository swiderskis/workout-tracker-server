import { sign } from "jsonwebtoken";
import Payload from "../interfaces/Payload";
import dotenv from "dotenv";

dotenv.config();

function generateToken(userId: string) {
  const payload: Payload = {
    userId: userId,
  };

  return sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });
}

export default generateToken;
