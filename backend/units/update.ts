import { api } from "encore.dev/api";
import db from "../db";
import { UpdateUnitRequest, Unit } from "./types";

export interface UpdateUnitParams {
  id: number;
}

export const update = api<UpdateUnitParams & UpdateUnitRequest, Unit>(
  { method: "PUT", path: "/units/:id", expose: true },
  async (req) => {
    // Check if unit exists first
    const existingUnit = await db.queryRow`
      SELECT building_id FROM units WHERE id = ${req.id}
    `;
    
    if (!existingUnit) {
      throw new Error("Unit not found");
    }

    // If updating unit number, check for conflicts
    if (req.unitNumber !== undefined) {
      const conflictUnit = await db.queryRow`
        SELECT id FROM units WHERE building_id = ${existingUnit.building_id} AND unit_number = ${req.unitNumber} AND id != ${req.id}
      `;
      
      if (conflictUnit) {
        throw new Error(`Unit number ${req.unitNumber} already exists in this building`);
      }
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (req.unitNumber !== undefined) {
      updateFields.push(`unit_number = $${paramIndex++}`);
      updateValues.push(req.unitNumber);
    }

    if (req.floor !== undefined) {
      updateFields.push(`floor = $${paramIndex++}`);
      updateValues.push(req.floor);
    }

    if (req.unitType !== undefined) {
      updateFields.push(`unit_type = $${paramIndex++}`);
      updateValues.push(req.unitType);
    }

    if (req.surfaceArea !== undefined) {
      updateFields.push(`surface_area = $${paramIndex++}`);
      updateValues.push(req.surfaceArea);
    }

    if (req.millieme !== undefined) {
      updateFields.push(`millieme = $${paramIndex++}`);
      updateValues.push(req.millieme);
    }

    if (req.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(req.description);
    }

    if (req.balconyArea !== undefined) {
      updateFields.push(`balcony_area = $${paramIndex++}`);
      updateValues.push(req.balconyArea);
    }

    if (req.garageIncluded !== undefined) {
      updateFields.push(`garage_included = $${paramIndex++}`);
      updateValues.push(req.garageIncluded);
    }

    if (req.storageIncluded !== undefined) {
      updateFields.push(`storage_included = $${paramIndex++}`);
      updateValues.push(req.storageIncluded);
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(req.id);

    const query = `
      UPDATE units 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const unit = await db.rawQueryRow(query, ...updateValues);

    if (!unit) {
      throw new Error("Failed to update unit");
    }

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
    };
  }
);