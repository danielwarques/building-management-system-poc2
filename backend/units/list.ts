import { api } from "encore.dev/api";
import db from "../db";
import { Unit } from "./types";

export interface ListUnitsRequest {
  buildingId?: number;
}

export interface ListUnitsResponse {
  units: Unit[];
}

export const list = api(
  { method: "GET", path: "/units", expose: true },
  async ({ buildingId }: ListUnitsRequest): Promise<ListUnitsResponse> => {
    let query = `
      SELECT 
        id,
        building_id,
        unit_number,
        floor,
        unit_type,
        surface_area,
        millieme,
        description,
        balcony_area,
        garage_included,
        storage_included,
        created_at,
        updated_at
      FROM units
    `;
    
    const params: any[] = [];
    
    if (buildingId) {
      query += ` WHERE building_id = $1`;
      params.push(buildingId);
    }
    
    query += ` ORDER BY building_id, unit_number`;
    
    const rows = await db.rawQueryAll(query, params);
    
    const units = rows.map((row: any) => ({
      id: row.id,
      buildingId: row.building_id,
      unitNumber: row.unit_number,
      floor: row.floor,
      unitType: row.unit_type,
      surfaceArea: row.surface_area,
      millieme: row.millieme,
      description: row.description,
      balconyArea: row.balcony_area,
      garageIncluded: row.garage_included,
      storageIncluded: row.storage_included,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { units };
  }
);