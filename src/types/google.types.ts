/**
 * Google OAuth email object
 */
export interface GoogleEmail {
  value: string;
  verified?: boolean;
}

/**
 * Google OAuth profile object from passport-google-oauth20
 */
export interface GoogleProfile {
  id: string;
  emails: GoogleEmail[];
  displayName: string;
  photos?: Array<{ value: string }>;
  provider: string;
  _raw: string;
  _json: Record<string, unknown>;
}

/**
 * Simplified Google user data for internal use
 */
export interface GoogleUserDto {
  googleId: string;
  email: string;
  name: string;
}
