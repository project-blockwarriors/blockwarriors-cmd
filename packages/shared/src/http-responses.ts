/**
 * Standardized HTTP response types.
 * 
 * All HTTP API responses should follow this format for consistency.
 * 
 * Success: { success: true, data: T }
 * Error:   { success: false, error: string }
 */

/**
 * Successful API response
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Error API response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Create a success response object
 */
export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}

/**
 * Create an error response object
 */
export function createErrorResponse(error: string): ApiErrorResponse {
  return { success: false, error };
}
