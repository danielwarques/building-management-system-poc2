import { api } from "encore.dev/api";
import db from "../db";
import { CreateUnitRequest, Unit } from "./types";

export const create = api(
  { method: "POST", path: "/units", expose: true },
  async (req: CreateUnitRequest): Promise<Unit> => {
    const {
      buildingId,
      unitNumber,
      floor,
      unitType,
      surfaceArea,
      millieme,
      description,
      balconyArea,
      garageIncluded = false,
      storageIncluded = false,
    } = req;

    // Check if unit number already exists in building
    const existingUnit = await db.queryRow`
      SELECT id FROM units WHERE building_id = ${buildingId} AND unit_number = ${unitNumber}
    `;

    if (existingUnit) {
      throw new Error(`Unit ${unitNumber} already exists in this building`);
    }

    const unit = await db.queryRow`
      INSERT INTO units (
        building_id, unit_number, floor, unit_type, surface_area,
        millieme, description, balcony_area, garage_included, storage_included
      ) VALUES (${buildingId}, ${unitNumber}, ${floor}, ${unitType}, ${surfaceArea}, ${millieme}, ${description}, ${balconyArea}, ${garageIncluded}, ${storageIncluded})
      RETURNING *
    `;

    if (!unit) {
      throw new Error("Failed to create unit");
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