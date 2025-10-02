import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import * as bcrypt from "bcryptjs";
import db from "../db";

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "building_owner" | "syndic" | "administrator";
  phone?: string;
  companyName?: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}

interface RegisterResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'building_owner' | 'syndic' | 'administrator';
}

// Registers a new user.
export const register = api<RegisterRequest, RegisterResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    if (!validateEmail(req.email)) {
      throw APIError.invalidArgument("invalid email format");
    }

    if (!validatePassword(req.password)) {
      throw APIError.invalidArgument("password must be at least 8 characters");
    }

    if (!req.firstName || req.firstName.trim().length === 0) {
      throw APIError.invalidArgument("first name is required");
    }

    if (!req.lastName || req.lastName.trim().length === 0) {
      throw APIError.invalidArgument("last name is required");
    }

    if (req.userType === 'syndic' && (!req.companyName || req.companyName.trim().length === 0)) {
      throw APIError.invalidArgument("company name is required for syndics");
    }

    const existingUser = await db.queryRow`
      SELECT id FROM building_owners WHERE email = ${req.email}
      UNION ALL
      SELECT id FROM syndics WHERE email = ${req.email}
      UNION ALL
      SELECT id FROM administrators WHERE email = ${req.email}
      LIMIT 1
    `;

    if (existingUser) {
      throw APIError.alreadyExists("user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(req.password, 12);

    let user;
    if (req.userType === 'building_owner') {
      user = await db.queryRow`
        INSERT INTO building_owners (email, password_hash, first_name, last_name, phone)
        VALUES (${req.email}, ${hashedPassword}, ${req.firstName}, ${req.lastName}, ${req.phone})
        RETURNING id, email, first_name, last_name, 'building_owner' as user_type
      `;
    } else if (req.userType === 'syndic') {
      user = await db.queryRow`
        INSERT INTO syndics (email, password_hash, first_name, last_name, company_name, phone)
        VALUES (${req.email}, ${hashedPassword}, ${req.firstName}, ${req.lastName}, ${req.companyName}, ${req.phone})
        RETURNING id, email, first_name, last_name, 'syndic' as user_type
      `;
    } else if (req.userType === 'administrator') {
      user = await db.queryRow`
        INSERT INTO administrators (email, password_hash, first_name, last_name, phone)
        VALUES (${req.email}, ${hashedPassword}, ${req.firstName}, ${req.lastName}, ${req.phone})
        RETURNING id, email, first_name, last_name, 'administrator' as user_type
      `;
    } else {
      throw APIError.invalidArgument("invalid user type");
    }

    if (!user) {
      throw APIError.internal("failed to create user");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
    };
  }
);
