import { api } from "encore.dev/api";
import db from "../db";

interface Supplier {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  specialties: string[];
  rating: number;
  totalJobs: number;
}

interface ListSuppliersResponse {
  suppliers: Supplier[];
}

// Retrieves all registered suppliers.
export const list = api<void, ListSuppliersResponse>(
  { expose: true, method: "GET", path: "/suppliers" },
  async () => {
    const suppliers = await db.queryAll`
      SELECT s.id, s.company_name, s.specialties, s.rating, s.total_jobs,
             CONCAT(u.first_name, ' ', u.last_name) as contact_name,
             u.email, u.phone
      FROM suppliers s
      INNER JOIN users u ON s.user_id = u.id
      WHERE u.active = true
      ORDER BY s.company_name
    `;

    return {
      suppliers: suppliers.map((supplier: any) => ({
        id: supplier.id,
        companyName: supplier.company_name,
        contactName: supplier.contact_name,
        email: supplier.email,
        phone: supplier.phone,
        specialties: supplier.specialties || [],
        rating: supplier.rating || 0,
        totalJobs: supplier.total_jobs || 0,
      })),
    };
  }
);
