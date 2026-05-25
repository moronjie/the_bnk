import { ZodError } from "zod";
import CustomError, { errorCodes } from "../middleware/errorHandler";
import HTTP_STATUS from "../config/http.confiq";

export function parseBody<T>(schema: { parse: (v: unknown) => T }, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.issues.map((e) => e.message).join('; ');
      throw new CustomError(message, errorCodes.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    throw err;
  }
}