import { api } from "encore.dev/api";
import db from "../db";
import { UnitOwner } from "./types";

export interface ListOwnersRequest {
  buildingId?: number;
  unitId?: number;
}

export interface ListOwnersResponse {
  owners: UnitOwner[];
}

export const list = api(
  { method: "GET", path: "/owners", expose: true },
  async ({ buildingId, unitId }: ListOwnersRequest): Promise<ListOwnersResponse> => {
    let query = `
      SELECT 
        unit_id,
        building_id,
        unit_number,
        unit_type,
        surface_area,
        millieme,
        owner_id,
        first_name,
        last_name,
        email,
        phone,
        ownership_percentage,
        start_date,
        is_primary_residence,
        is_rental_property
      FROM current_unit_owners
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (buildingId) {
      conditions.push(`building_id = $${params.length + 1}`);
      params.push(buildingId);
    }
    
    if (unitId) {
      conditions.push(`unit_id = $${params.length + 1}`);
      params.push(unitId);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY building_id, unit_number, ownership_percentage DESC`;
    
    const rows = await db.rawQueryAll(query, params);
    
    const owners = rows.map((row: any) => ({
      unitId: row.unit_id,
      buildingId: row.building_id,
      unitNumber: row.unit_number,
      unitType: row.unit_type,
      surfaceArea: row.surface_area,
      millieme: row.millieme,
      ownerId: row.owner_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      ownershipPercentage: row.ownership_percentage,
      startDate: row.start_date,
      isPrimaryResidence: row.is_primary_residence,
      isRentalProperty: row.is_rental_property,
    }));

    return { owners };
  }
);