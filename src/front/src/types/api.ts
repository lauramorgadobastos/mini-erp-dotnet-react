export interface ApiErrorResponse {
  message?: string;
  detail?: string;
  title?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: ApiErrorResponse;

  constructor(message: string, status: number, details?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}