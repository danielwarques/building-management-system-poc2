import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { ConseilCopropriete } from "./types";

interface GetConseilRequest {
  buildingId: number;
}

export const get = api(
  { method: "GET", path: "/conseil/:buildingId", expose: true, auth: true },
  async ({ buildingId }: GetConseilRequest): Promise<ConseilCopropriete> => {
    try {
      const conseil = await db.queryRow`
        SELECT 
          c.id, c.building_id, c.president_id, c.created_at, c.updated_at,
          b.name as building_name
        FROM conseil_copropriete c
        JOIN buildings b ON c.building_id = b.id
        WHERE c.building_id = ${buildingId}
      `;

      if (!conseil) {
        throw APIError.notFound("Conseil not found for this building");
      }

      const membersRows = await db.queryAll`
        SELECT 
          cm.id, cm.user_id, cm.role, cm.elected_at, cm.term_end_date, cm.active,
          u.first_name, u.last_name, u.email
        FROM conseil_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.conseil_id = ${conseil.id} AND cm.active = true
        ORDER BY 
          CASE cm.role 
            WHEN 'president' THEN 1 
            WHEN 'secretary' THEN 2 
            WHEN 'treasurer' THEN 3 
            ELSE 4 
          END
      `;

      const members = Array.from(membersRows);

      const president = members.find(m => m.role === 'president');

      return {
        id: conseil.id,
        buildingId: conseil.building_id,
        buildingName: conseil.building_name,
        presidentId: conseil.president_id,
        president: president ? {
          id: president.id,
          userId: president.user_id,
          firstName: president.first_name,
          lastName: president.last_name,
          email: president.email,
          role: president.role,
          electedAt: president.elected_at,
          termEndDate: president.term_end_date,
          active: president.active
        } : undefined,
        members: members.map((m: any) => ({
          id: m.id,
          userId: m.user_id,
          firstName: m.first_name,
          lastName: m.last_name,
          email: m.email,
          role: m.role,
          electedAt: m.elected_at,
          termEndDate: m.term_end_date,
          active: m.active
        })),
        createdAt: conseil.created_at,
        updatedAt: conseil.updated_at
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to get conseil", error as Error);
    }
  }
);