import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

interface GetBuildingParams {
  id: number;
}

interface Asset {
  id: number;
  name: string;
  category: string;
  description: string;
  warrantyExpiry: string | null;
  lastMaintenance: string | null;
}

interface ConseilMember {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
}

interface Conseil {
  id: number;
  president?: ConseilMember;
  members: ConseilMember[];
}

interface BuildingDetails {
  id: number;
  name: string;
  address: string;
  unitsCount: number;
  syndicName: string;
  syndicType: string;
  syndicCompanyName?: string;
  syndicContactEmail?: string;
  syndicContactPhone?: string;
  conseil?: Conseil;
  assets: Asset[];
}

// Retrieves detailed information about a specific building.
export const get = api<GetBuildingParams, BuildingDetails>(
  { expose: true, method: "GET", path: "/buildings/:id" },
  async (params) => {
    const building = await db.queryRow`
      SELECT 
        b.id, b.name, b.address, b.units_count,
        b.syndic_type, b.syndic_company_name, 
        b.syndic_contact_email, b.syndic_contact_phone,
        CONCAT(u.first_name, ' ', u.last_name) as syndic_name,
        c.id as conseil_id
      FROM buildings b
      LEFT JOIN users u ON b.syndic_id = u.id
      LEFT JOIN conseil_copropriete c ON b.conseil_id = c.id
      WHERE b.id = ${params.id}
    `;

    if (!building) {
      throw APIError.notFound("building not found");
    }

    const assets = await db.queryAll`
      SELECT id, name, category, description, warranty_expiry, last_maintenance
      FROM assets
      WHERE building_id = ${params.id}
      ORDER BY category, name
    `;

    // Get conseil information if exists
    let conseil: Conseil | undefined;
    if (building.conseil_id) {
      const conseilMembers = await db.queryAll`
        SELECT 
          cm.id, cm.role,
          u.first_name, u.last_name, u.email
        FROM conseil_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.conseil_id = ${building.conseil_id} AND cm.active = true
        ORDER BY 
          CASE cm.role 
            WHEN 'president' THEN 1 
            WHEN 'secretary' THEN 2 
            WHEN 'treasurer' THEN 3 
            ELSE 4 
          END
      `;

      const members = conseilMembers.map((m: any) => ({
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        role: m.role,
        email: m.email,
      }));

      const president = members.find(m => m.role === 'president');

      conseil = {
        id: building.conseil_id,
        president,
        members,
      };
    }

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      unitsCount: building.units_count,
      syndicName: building.syndic_name || "No Syndic",
      syndicType: building.syndic_type,
      syndicCompanyName: building.syndic_company_name,
      syndicContactEmail: building.syndic_contact_email,
      syndicContactPhone: building.syndic_contact_phone,
      conseil,
      assets: assets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        description: asset.description || "",
        warrantyExpiry: asset.warranty_expiry,
        lastMaintenance: asset.last_maintenance,
      })),
    };
  }
);
