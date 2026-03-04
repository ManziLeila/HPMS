export class HttpError extends Error {
  constructor(status, message, code = 'HTTP_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const unauthorized = (message = 'Unauthorized') =>
  new HttpError(401, message, 'UNAUTHORIZED');

export const forbidden = (message = 'Forbidden') => new HttpError(403, message, 'FORBIDDEN');

export const badRequest = (message = 'Bad request') =>
  new HttpError(400, message, 'BAD_REQUEST');

export const notFound = (message = 'Not found') => new HttpError(404, message, 'NOT_FOUND');

