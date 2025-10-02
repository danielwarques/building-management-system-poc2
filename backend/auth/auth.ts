import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import jwt from "jsonwebtoken";
import db from "../db";

const jwtSecret = secret("JWTSecret");

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
  userType: 'building_owner' | 'syndic' | 'administrator';
  firstName: string;
  lastName: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const authHeader = data.authorization;
    if (!authHeader) {
      throw APIError.unauthenticated("missing authorization header");
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw APIError.unauthenticated("invalid authorization header format");
    }

    const token = authHeader.substring(7);
    if (!token || token.trim() === "") {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const secretValue = jwtSecret();
      if (!secretValue) {
        throw new Error("JWT secret not configured");
      }

      const payload = jwt.verify(token, secretValue) as any;

      if (!payload.userID) {
        throw new Error("invalid token payload: missing userID");
      }

      const userIdNum = parseInt(payload.userID, 10);
      if (isNaN(userIdNum)) {
        throw new Error("invalid userID format");
      }

      const user = await db.queryRow`
        SELECT id, email, 'building_owner' as user_type, first_name, last_name, active
        FROM building_owners
        WHERE id = ${userIdNum} AND active = true
        UNION ALL
        SELECT id, email, 'syndic' as user_type, first_name, last_name, active
        FROM syndics
        WHERE id = ${userIdNum} AND active = true
        UNION ALL
        SELECT id, email, 'administrator' as user_type, first_name, last_name, active
        FROM administrators
        WHERE id = ${userIdNum} AND active = true
        LIMIT 1
      `;

      if (!user) {
        throw new Error("user not found or inactive");
      }

      return {
        userID: user.id.toString(),
        email: user.email,
        userType: user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
      };
    } catch (err) {
      if (err && typeof err === 'object' && 'name' in err) {
        if (err.name === 'JsonWebTokenError') {
          throw APIError.unauthenticated("invalid token format");
        } else if (err.name === 'TokenExpiredError') {
          throw APIError.unauthenticated("token expired");
        } else if (err.name === 'NotBeforeError') {
          throw APIError.unauthenticated("token not active");
        }
      }
      if (err instanceof Error) {
        throw APIError.unauthenticated("authentication failed: " + err.message);
      }
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });
