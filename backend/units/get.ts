import { api } from "encore.dev/api";
import db from "../db";
import { UnitWithOwners } from "./types";

export interface GetUnitRequest {
  id: number;
}

export const get = api(
  { method: "GET", path: "/units/:id", expose: true },
  async ({ id }: GetUnitRequest): Promise<UnitWithOwners> => {
    const unit = await db.queryRow`
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
      FROM units WHERE id = ${id}
    `;

    if (!unit) {
      throw new Error("Unit not found");
    }

    // Get current owners
    const ownersRows = await db.rawQueryAll(`
      SELECT 
        usr.id,
        usr.first_name,
        usr.last_name,
        usr.email,
        usr.phone,
        o.ownership_percentage,
        o.is_primary_residence,
        o.is_rental_property
      FROM ownerships o
      JOIN users usr ON o.owner_id = usr.id
      WHERE o.unit_id = $1 AND o.active = TRUE 
        AND (o.end_date IS NULL OR o.end_date > CURRENT_DATE)
      ORDER BY o.ownership_percentage DESC
    `, [id]);

    const owners = ownersRows.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      ownershipPercentage: row.ownership_percentage,
      isPrimaryResidence: row.is_primary_residence,
      isRentalProperty: row.is_rental_property,
    }));

    return {
      id: unit.id,
      buildingId: unit.building_id,
      unitNumber: unit.unit_number,
      floor: unit.floor,
      unitType: unit.unit_type,
      surfaceArea: unit.surface_area,
      millieme: unit.millieme,
      description: unit.description,
      balconyArea: unit.balcony_area,
      garageIncluded: unit.garage_included,
      storageIncluded: unit.storage_included,
      createdAt: unit.created_at,
      updatedAt: unit.updated_at,
      owners,
    };
  }
);