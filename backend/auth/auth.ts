import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import * as jwt from "jsonwebtoken";
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
    console.log("Auth handler called with authorization header:", data.authorization ? "present" : "missing");
    
    // Extract token from Authorization header
    const authHeader = data.authorization;
    if (!authHeader) {
      console.log("Auth handler: No authorization header provided");
      throw APIError.unauthenticated("missing authorization header");
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.log("Auth handler: Invalid authorization header format:", authHeader.substring(0, 20) + "...");
      throw APIError.unauthenticated("invalid authorization header format");
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    if (!token || token.trim() === "") {
      console.log("Auth handler: Empty token after Bearer prefix");
      throw APIError.unauthenticated("missing token");
    }

    console.log("Auth handler: Token extracted, length:", token.length);

    try {
      let secretValue: string;
      try {
        secretValue = jwtSecret();
        if (!secretValue) {
          console.log("Auth handler: JWT secret is empty, using fallback");
          // Fallback to a default development secret if not set
          secretValue = "development-jwt-secret-please-change-in-production";
        }
      } catch (err) {
        console.error("JWT secret error:", err);
        console.log("Auth handler: Using fallback JWT secret");
        // Use development fallback
        secretValue = "development-jwt-secret-please-change-in-production";
      }

      console.log("Auth handler: validating token with secret length:", secretValue.length);
      console.log("Auth handler: token preview:", token.substring(0, 50) + "...");
      
      const payload = jwt.verify(token, secretValue) as any;
      console.log("Auth handler: JWT payload:", { userID: payload.userID, email: payload.email });
      
      if (!payload.userID) {
        console.log("Auth handler: JWT payload missing userID");
        throw new Error("invalid token payload: missing userID");
      }
      
      // Convert userID to number for database query
      const userIdNum = parseInt(payload.userID, 10);
      if (isNaN(userIdNum)) {
        throw new Error("invalid userID format");
      }

      // Try to find user in building_owners first
      let user = await db.queryRow`
        SELECT id, email, 'building_owner' as user_type, first_name, last_name, active
        FROM building_owners
        WHERE id = ${userIdNum} AND active = true
      `;
      
      // If not found, try syndics
      if (!user) {
        user = await db.queryRow`
          SELECT id, email, 'syndic' as user_type, first_name, last_name, active
          FROM syndics
          WHERE id = ${userIdNum} AND active = true
        `;
      }
      
      // If still not found, try administrators
      if (!user) {
        user = await db.queryRow`
          SELECT id, email, 'administrator' as user_type, first_name, last_name, active
          FROM administrators
          WHERE id = ${userIdNum} AND active = true
        `;
      }

      console.log("Auth handler: Database user lookup result:", user ? "found" : "not found");

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
      console.error("Auth handler error details:", err);
      if (err && typeof err === 'object' && 'name' in err) {
        if (err.name === 'JsonWebTokenError') {
          console.error("JWT Error type:", err.name, "Message:", 'message' in err ? err.message : 'unknown');
          throw APIError.unauthenticated("invalid token format");
        } else if (err.name === 'TokenExpiredError') {
          console.error("JWT Token expired");
          throw APIError.unauthenticated("token expired");
        } else if (err.name === 'NotBeforeError') {
          console.error("JWT Token not active yet");
          throw APIError.unauthenticated("token not active");
        }
      }
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });
