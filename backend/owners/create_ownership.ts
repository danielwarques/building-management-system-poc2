import { api } from "encore.dev/api";
import db from "../db";
import { CreateOwnershipRequest, Ownership } from "./types";

export const createOwnership = api(
  { method: "POST", path: "/owners/ownership", expose: true },
  async (req: CreateOwnershipRequest): Promise<Ownership> => {
    const {
      unitId,
      ownerId,
      ownershipPercentage = 100,
      startDate = new Date(),
      endDate,
      purchasePrice,
      notaryReference,
      isPrimaryResidence = true,
      isRentalProperty = false,
    } = req;

    // Validate that the sum of ownership percentages doesn't exceed 100%
    const currentOwnership = await db.queryRow`
      SELECT COALESCE(SUM(ownership_percentage), 0) as total_percentage
      FROM ownerships 
      WHERE unit_id = ${unitId} AND active = TRUE AND (end_date IS NULL OR end_date > CURRENT_DATE)
    `;
    
    const currentTotal = parseFloat(currentOwnership?.total_percentage || '0');
    if (currentTotal + ownershipPercentage > 100) {
      throw new Error(`Total ownership percentage cannot exceed 100%. Current total: ${currentTotal}%`);
    }

    const ownership = await db.queryRow`
      INSERT INTO ownerships (
        unit_id, owner_id, ownership_percentage, start_date, end_date,
        purchase_price, notary_reference, is_primary_residence, is_rental_property
      ) VALUES (${unitId}, ${ownerId}, ${ownershipPercentage}, ${startDate}, ${endDate}, ${purchasePrice}, ${notaryReference}, ${isPrimaryResidence}, ${isRentalProperty})
      RETURNING *
    `;

    if (!ownership) {
      throw new Error("Failed to create ownership");
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