/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Response format for login endpoint
 */
export interface JwtLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}
