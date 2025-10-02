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

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
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
    if (!validateEmail(req.email)) {
      throw APIError.invalidArgument("invalid email format");
    }

    if (!validatePassword(req.password)) {
      throw APIError.invalidArgument("password must be at least 8 characters");
    }

    const user = await db.queryRow`
      SELECT id, email, password_hash, first_name, last_name, 'building_owner' as user_type, active
      FROM building_owners
      WHERE email = ${req.email}
      UNION ALL
      SELECT id, email, password_hash, first_name, last_name, 'syndic' as user_type, active
      FROM syndics
      WHERE email = ${req.email}
      UNION ALL
      SELECT id, email, password_hash, first_name, last_name, 'administrator' as user_type, active
      FROM administrators
      WHERE email = ${req.email}
      LIMIT 1
    `;

    if (!user || !user.active) {
      throw APIError.unauthenticated("invalid credentials");
    }

    const validPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!validPassword) {
      throw APIError.unauthenticated("invalid credentials");
    }

    const secretValue = jwtSecret();
    if (!secretValue) {
      throw APIError.internal("JWT secret not configured");
    }

    const payload = { userID: user.id.toString(), email: user.email, userType: user.user_type };

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
