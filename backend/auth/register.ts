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
  companyName?: string; // For syndics
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
    console.log("Register request received:", { ...req, password: "[HIDDEN]" });
    
    try {
      // Check if email already exists in any of the user tables
      const existingOwner = await db.queryRow`
        SELECT id FROM building_owners WHERE email = ${req.email}
      `;
      const existingSyndic = await db.queryRow`
        SELECT id FROM syndics WHERE email = ${req.email}
      `;
      const existingAdmin = await db.queryRow`
        SELECT id FROM administrators WHERE email = ${req.email}
      `;

      if (existingOwner || existingSyndic || existingAdmin) {
        throw APIError.alreadyExists("user with this email already exists");
      }



    const hashedPassword = await bcrypt.hash(req.password, 12);
    console.log("Creating user with type:", req.userType);

    let user;
    if (req.userType === 'building_owner') {
      console.log("Inserting building owner");
      user = await db.queryRow`
        INSERT INTO building_owners (email, password_hash, first_name, last_name, phone)
        VALUES (${req.email}, ${hashedPassword}, ${req.firstName}, ${req.lastName}, ${req.phone})
        RETURNING id, email, first_name, last_name, 'building_owner' as user_type
      `;
    } else if (req.userType === 'syndic') {
      console.log("Inserting syndic with company:", req.companyName);
      user = await db.queryRow`
        INSERT INTO syndics (email, password_hash, first_name, last_name, company_name, phone)
        VALUES (${req.email}, ${hashedPassword}, ${req.firstName}, ${req.lastName}, ${req.companyName}, ${req.phone})
        RETURNING id, email, first_name, last_name, 'syndic' as user_type
      `;
    } else if (req.userType === 'administrator') {
      console.log("Inserting administrator");
      user = await db.queryRow`
        INSERT INTO administrators (email, password_hash, first_name, last_name, phone)
        VALUES (${req.email}, ${hashedPassword}, ${req.firstName}, ${req.lastName}, ${req.phone})
        RETURNING id, email, first_name, last_name, 'administrator' as user_type
      `;
    } else {
      throw APIError.invalidArgument(`Invalid user type: ${req.userType}`);
    }

    console.log("User created successfully:", user);

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
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }
);
