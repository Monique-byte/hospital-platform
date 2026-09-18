export interface JwtAccessPayload {
  sub: string;
  login: string;
  roles: string[];
  permissions: string[];
}

export interface LoginInput {
  login: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  };
}
