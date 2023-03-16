import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import RequestPayload from "../interfaces/RequestPayload";

interface Payload {
  userId: string;
}

// Authorises token
async function authorisation(
  req: RequestPayload,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.header("token");

    if (!token) {
      return res.status(401).json("No token");
    }

    const payload = verify(token, process.env.JWT_SECRET) as Payload;

    req.userId = payload.userId;

    next();
  } catch (err: unknown) {
    return res.status(403).json("Incorrect or expired token");
  }
}

export default authorisation;
