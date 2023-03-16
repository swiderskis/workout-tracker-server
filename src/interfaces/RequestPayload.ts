import { Request } from "express";

interface RequestPayload extends Request {
  userId: string;
}

export default RequestPayload;
