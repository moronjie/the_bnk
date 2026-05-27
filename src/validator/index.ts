import { ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
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

/**
 * Validation middleware for Zod schemas
 * Validates req.body, req.query, and req.params
 */
export function validate(schema: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        return next(
          new CustomError(message, errorCodes.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY)
        );
      }
      next(err);
    }
  };
}