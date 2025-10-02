import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { UpdateUnitRequest, Unit } from "./types";
import { buildUpdateQuery } from "./update_helper";

export interface UpdateUnitParams {
  id: number;
}

export const update = api<UpdateUnitParams & UpdateUnitRequest, Unit>(
  { method: "PUT", path: "/units/:id", expose: true },
  async (req) => {
    const existingUnit = await db.queryRow`
      SELECT building_id FROM units WHERE id = ${req.id}
    `;

    if (!existingUnit) {
      throw APIError.notFound("unit not found");
    }

    if (req.unitNumber !== undefined) {
      const conflictUnit = await db.queryRow`
        SELECT id FROM units WHERE building_id = ${existingUnit.building_id} AND unit_number = ${req.unitNumber} AND id != ${req.id}
      `;

      if (conflictUnit) {
        throw APIError.alreadyExists(`unit number ${req.unitNumber} already exists in this building`);
      }
    }

    const updateFields: Array<{ column: string; value: any }> = [];

    if (req.unitNumber !== undefined) {
      updateFields.push({ column: 'unit_number', value: req.unitNumber });
    }
    if (req.floor !== undefined) {
      updateFields.push({ column: 'floor', value: req.floor });
    }
    if (req.unitType !== undefined) {
      updateFields.push({ column: 'unit_type', value: req.unitType });
    }
    if (req.surfaceArea !== undefined) {
      updateFields.push({ column: 'surface_area', value: req.surfaceArea });
    }
    if (req.millieme !== undefined) {
      updateFields.push({ column: 'millieme', value: req.millieme });
    }
    if (req.description !== undefined) {
      updateFields.push({ column: 'description', value: req.description });
    }
    if (req.balconyArea !== undefined) {
      updateFields.push({ column: 'balcony_area', value: req.balconyArea });
    }
    if (req.garageIncluded !== undefined) {
      updateFields.push({ column: 'garage_included', value: req.garageIncluded });
    }
    if (req.storageIncluded !== undefined) {
      updateFields.push({ column: 'storage_included', value: req.storageIncluded });
    }

    if (updateFields.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }

    const { query, values } = buildUpdateQuery('units', updateFields, 'id', req.id);
    const unit = await db.rawQueryRow(query, ...values);

    if (!unit) {
      throw APIError.internal("failed to update unit");
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