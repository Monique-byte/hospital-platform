import { JwtAccessPayload } from "@modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      /** Preenchido pelo middleware `authenticate` a partir do JWT. */
      user?: JwtAccessPayload;
    }
  }
}

export {};
