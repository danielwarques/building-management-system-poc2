import { api } from "encore.dev/api";
import db from "../db";
import { UpdateOwnershipRequest, Ownership } from "./types";

export interface UpdateOwnershipParams {
  id: number;
}

export const updateOwnership = api<UpdateOwnershipParams & UpdateOwnershipRequest, Ownership>(
  { method: "PUT", path: "/owners/ownership/:id", expose: true },
  async (req) => {
    // First check if ownership exists and get current values
    const currentOwnership = await db.queryRow`
      SELECT unit_id, ownership_percentage FROM ownerships WHERE id = ${req.id}
    `;
    
    if (!currentOwnership) {
      throw new Error("Ownership not found");
    }

    // If updating ownership percentage, validate total doesn't exceed 100%
    if (req.ownershipPercentage !== undefined) {
      const otherOwnerships = await db.queryRow`
        SELECT COALESCE(SUM(ownership_percentage), 0) as total_percentage
        FROM ownerships 
        WHERE unit_id = ${currentOwnership.unit_id} AND id != ${req.id} AND active = TRUE AND (end_date IS NULL OR end_date > CURRENT_DATE)
      `;
      
      const otherTotal = parseFloat(otherOwnerships?.total_percentage || '0');
      if (otherTotal + req.ownershipPercentage > 100) {
        throw new Error(`Total ownership percentage cannot exceed 100%. Other ownerships total: ${otherTotal}%`);
      }
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (req.ownershipPercentage !== undefined) {
      updateFields.push(`ownership_percentage = $${paramIndex++}`);
      updateValues.push(req.ownershipPercentage);
    }

    if (req.endDate !== undefined) {
      updateFields.push(`end_date = $${paramIndex++}`);
      updateValues.push(req.endDate);
    }

    if (req.purchasePrice !== undefined) {
      updateFields.push(`purchase_price = $${paramIndex++}`);
      updateValues.push(req.purchasePrice);
    }

    if (req.notaryReference !== undefined) {
      updateFields.push(`notary_reference = $${paramIndex++}`);
      updateValues.push(req.notaryReference);
    }

    if (req.isPrimaryResidence !== undefined) {
      updateFields.push(`is_primary_residence = $${paramIndex++}`);
      updateValues.push(req.isPrimaryResidence);
    }

    if (req.isRentalProperty !== undefined) {
      updateFields.push(`is_rental_property = $${paramIndex++}`);
      updateValues.push(req.isRentalProperty);
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(req.id);

    const query = `
      UPDATE ownerships 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const ownership = await db.rawQueryRow(query, ...updateValues);

    if (!ownership) {
      throw new Error("Failed to update ownership");
    }

    return {
      id: ownership.id,
      unitId: ownership.unit_id,
      ownerId: ownership.owner_id,
      ownershipPercentage: ownership.ownership_percentage,
      startDate: ownership.start_date,
      endDate: ownership.end_date,
      purchasePrice: ownership.purchase_price,
      notaryReference: ownership.notary_reference,
      isPrimaryResidence: ownership.is_primary_residence,
      isRentalProperty: ownership.is_rental_property,
      active: ownership.active,
      createdAt: ownership.created_at,
      updatedAt: ownership.updated_at,
    };
  }
);