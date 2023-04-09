import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

// Authorises token
function authentication(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.header("token");

    if (!token) {
      return res.status(401).json("No token");
    }

    const payload: any = verify(token, process.env.JWT_SECRET as string);

    res.locals.userId = payload.userId;

    next();
  } catch (err: unknown) {
    return res.status(403).json("Incorrect or expired token");
  }
}

export default authentication;
