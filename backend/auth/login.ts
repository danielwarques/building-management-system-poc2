import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db";

const jwtSecret = secret("JWTSecret");

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    userType: 'building_owner' | 'syndic' | 'administrator';
  };
}

// Authenticates a user and returns a JWT token.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    // Try to find user in building_owners first
    let user = await db.queryRow`
      SELECT id, email, password_hash, first_name, last_name, 'building_owner' as user_type, active
      FROM building_owners
      WHERE email = ${req.email}
    `;
    
    // If not found, try syndics
    if (!user) {
      user = await db.queryRow`
        SELECT id, email, password_hash, first_name, last_name, 'syndic' as user_type, active
        FROM syndics
        WHERE email = ${req.email}
      `;
    }
    
    // If still not found, try administrators
    if (!user) {
      user = await db.queryRow`
        SELECT id, email, password_hash, first_name, last_name, 'administrator' as user_type, active
        FROM administrators
        WHERE email = ${req.email}
      `;
    }

    if (!user || !user.active) {
      throw APIError.unauthenticated("invalid credentials");
    }

    const validPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!validPassword) {
      throw APIError.unauthenticated("invalid credentials");
    }

    let secretValue: string;
    try {
      secretValue = jwtSecret();
      if (!secretValue) {
        console.log("Login: JWT secret is empty, using fallback");
        // Fallback to a default development secret if not set
        secretValue = "development-jwt-secret-please-change-in-production";
      }
    } catch (err) {
      console.error("JWT secret error:", err);
      console.log("Login: Using fallback JWT secret");
      // Use development fallback
      secretValue = "development-jwt-secret-please-change-in-production";
    }

    console.log("Login: creating token with secret length:", secretValue.length);
    console.log("Login: secret preview:", secretValue.substring(0, 10) + "...");
    const payload = { userID: user.id.toString(), email: user.email, userType: user.user_type };
    console.log("Login: JWT payload:", payload);
    
    const token = jwt.sign(
      payload,
      secretValue,
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
      },
    };
  }
);
