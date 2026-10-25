export class AuthError extends Error {
  statusCode: number;
  data?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 400,
    data?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.data = data;
  }
}
