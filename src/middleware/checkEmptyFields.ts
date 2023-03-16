import { NextFunction, Request, Response } from "express";

// Checks if any fields are empty
function checkEmptyFields(req: Request, res: Response, next: NextFunction) {
  const parameters = req.body;
  const parameterValues = Object.values(parameters);

  if (parameterValues.some((value) => !value)) {
    return res.status(401).json("Please fill in all fields");
  }

  next();
}

export default checkEmptyFields;
