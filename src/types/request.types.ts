import { Request } from 'express';

/**
 * User information attached to request after authentication
 */
export interface RequestUser {
  userId: string;
  email: string;
}

/**
 * Authenticated request with user information
 * Use this type in controllers for authenticated endpoints
 */
export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
