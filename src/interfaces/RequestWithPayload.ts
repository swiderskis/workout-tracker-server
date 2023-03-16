import { Request } from "express";

interface RequestWithPayload extends Request {
  userId: string;
}

export default RequestWithPayload;
