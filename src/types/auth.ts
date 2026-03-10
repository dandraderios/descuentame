export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string | null;
  role?: "admin" | "editor";
}

export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface GoogleAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}
