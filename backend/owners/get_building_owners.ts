import { api } from "encore.dev/api";
import db from "../db";

interface BuildingOwner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
}

interface GetBuildingOwnersRequest {
  buildingId: number;
}

interface GetBuildingOwnersResponse {
  owners: BuildingOwner[];
}

export const getBuildingOwners = api(
  { method: "GET", path: "/owners/building/:buildingId", expose: true },
  async ({ buildingId }: GetBuildingOwnersRequest): Promise<GetBuildingOwnersResponse> => {
    const rows = await db.rawQueryAll(`
      SELECT DISTINCT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role
      FROM users u
      JOIN ownerships o ON u.id = o.owner_id
      JOIN units un ON o.unit_id = un.id
      WHERE un.building_id = $1 
        AND u.role = 'owner' 
        AND u.active = TRUE
        AND o.active = TRUE 
        AND (o.end_date IS NULL OR o.end_date > CURRENT_DATE)
      ORDER BY u.first_name, u.last_name
    `, [buildingId]);

    const owners = rows.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
    }));

    return { owners };
  }
);