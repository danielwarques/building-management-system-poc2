import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

interface CreateSupplierRequest {
  userId: number;
  companyName: string;
  specialties: string[];
}

interface CreateSupplierResponse {
  id: number;
  companyName: string;
  specialties: string[];
}

// Creates a new supplier profile.
export const create = api<CreateSupplierRequest, CreateSupplierResponse>(
  { expose: true, method: "POST", path: "/suppliers" },
  async (req) => {
    // Verify user exists and has supplier role
    const user = await db.queryRow`
      SELECT id, role FROM users WHERE id = ${req.userId} AND role = 'supplier'
    `;

    if (!user) {
      throw APIError.invalidArgument("user not found or not a supplier");
    }

    // Check if supplier already exists
    const existing = await db.queryRow`
      SELECT id FROM suppliers WHERE user_id = ${req.userId}
    `;

    if (existing) {
      throw APIError.alreadyExists("supplier profile already exists for this user");
    }

    const supplier = await db.queryRow`
      INSERT INTO suppliers (user_id, company_name, specialties)
      VALUES (${req.userId}, ${req.companyName}, ${req.specialties})
      RETURNING id, company_name, specialties
    `;

    if (!supplier) {
      throw APIError.internal("failed to create supplier");
    }

    return {
      id: supplier.id,
      companyName: supplier.company_name,
      specialties: supplier.specialties || [],
    };
  }
);
