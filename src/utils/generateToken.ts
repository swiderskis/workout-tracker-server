import { sign } from "jsonwebtoken";
import Payload from "../interfaces/Payload";

function generateToken(userId: string) {
  const payload: Payload = {
    userId: userId,
  };

  return sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
}

export default generateToken;
