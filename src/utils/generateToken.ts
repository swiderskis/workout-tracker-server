import { sign } from "jsonwebtoken";

function generateToken(userId: string) {
  const payload = {
    userId: userId,
  };

  return sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1hr",
  });
}

export default generateToken;
