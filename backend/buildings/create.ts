import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

interface CreateBuildingRequest {
  name: string;
  address: string;
  unitsCount: number;
  syndicId?: number;
  syndicType: 'professional' | 'voluntary';
  syndicCompanyName?: string;
  syndicLicenseNumber?: string;
  syndicContactEmail?: string;
  syndicContactPhone?: string;
}

interface CreateBuildingResponse {
  id: number;
  name: string;
  address: string;
  unitsCount: number;
  syndicType: string;
  syndicCompanyName?: string;
  syndicContactEmail?: string;
}

// Creates a new building.
export const create = api<CreateBuildingRequest, CreateBuildingResponse>(
  { expose: true, method: "POST", path: "/buildings" },
  async (req) => {
    // Validate syndic if provided
    if (req.syndicId) {
      const syndic = await db.queryRow`
        SELECT id, role FROM users WHERE id = ${req.syndicId} AND active = true
      `;
      
      if (!syndic) {
        throw APIError.notFound("Syndic not found or inactive");
      }
      
      if (syndic.role !== 'syndic' && syndic.role !== 'admin') {
        throw APIError.invalidArgument("User must have syndic role");
      }
    }

    const building = await db.queryRow`
      INSERT INTO buildings (
        name, address, units_count, syndic_id, syndic_type, 
        syndic_company_name, syndic_license_number, 
        syndic_contact_email, syndic_contact_phone
      )
      VALUES (
        ${req.name}, ${req.address}, ${req.unitsCount}, ${req.syndicId}, ${req.syndicType},
        ${req.syndicCompanyName}, ${req.syndicLicenseNumber},
        ${req.syndicContactEmail}, ${req.syndicContactPhone}
      )
      RETURNING id, name, address, units_count, syndic_type, syndic_company_name, syndic_contact_email
    `;

    if (!building) {
      throw APIError.internal("failed to create building");
    }

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      unitsCount: building.units_count,
      syndicType: building.syndic_type,
      syndicCompanyName: building.syndic_company_name,
      syndicContactEmail: building.syndic_contact_email,
    };
  }
);
