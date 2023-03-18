import { NextFunction, Request, Response } from "express";

// Checks if any fields are empty
function checkEmptyFields(req: Request, res: Response, next: NextFunction) {
  const parameters = req.body;
  const parameterValues = Object.values(parameters);

  function fieldHasContent(value: unknown) {
    if (typeof value === "string" && value.length === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }

  // Returns 400 if any fields of passed parameters are empty
  if (parameterValues.some((value) => !fieldHasContent(value))) {
    return res.status(400).json("Please fill in all fields");
  }

  next();
}

export default checkEmptyFields;
