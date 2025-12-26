export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details);

export const notFound = (message: string, details?: unknown) =>
  new HttpError(404, message, details);

export const conflict = (message: string, details?: unknown) =>
  new HttpError(409, message, details);
