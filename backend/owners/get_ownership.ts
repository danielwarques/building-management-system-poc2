import { api } from "encore.dev/api";
import db from "../db";
import { Ownership } from "./types";

export interface GetOwnershipRequest {
  id: number;
}

export const getOwnership = api(
  { method: "GET", path: "/owners/ownership/:id", expose: true },
  async ({ id }: GetOwnershipRequest): Promise<Ownership> => {
    const ownership = await db.queryRow`
      SELECT * FROM ownerships WHERE id = ${id}
    `;

    if (!ownership) {
      throw new Error("Ownership not found");
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