import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { CreateConseilRequest, ConseilCopropriete } from "./types";

export const create = api(
  { method: "POST", path: "/conseil", expose: true, auth: true },
  async (req: CreateConseilRequest): Promise<ConseilCopropriete> => {
    try {
      // Check if conseil already exists for this building
      const existingConseil = await db.queryRow`
        SELECT id FROM conseil_copropriete WHERE building_id = ${req.buildingId}
      `;
      
      if (existingConseil) {
        throw APIError.alreadyExists("Conseil already exists for this building");
      }

      // Verify building exists
      const building = await db.queryRow`
        SELECT id, name FROM buildings WHERE id = ${req.buildingId}
      `;
      
      if (!building) {
        throw APIError.notFound("Building not found");
      }

      // Verify all member users exist and have appropriate roles
      for (const member of req.members) {
        const user = await db.queryRow`
          SELECT id, role FROM users WHERE id = ${member.userId} AND active = true
        `;
        
        if (!user) {
          throw APIError.notFound(`User ${member.userId} not found or inactive`);
        }
        
        if (user.role !== 'owner' && user.role !== 'conseil_member') {
          throw APIError.invalidArgument(`User ${member.userId} must be an owner or conseil member`);
        }
      }

      // Create conseil
      const conseil = await db.queryRow`
        INSERT INTO conseil_copropriete (building_id, president_id, created_at, updated_at)
        VALUES (${req.buildingId}, ${req.presidentId}, NOW(), NOW())
        RETURNING id, building_id, president_id, created_at, updated_at
      `;

      if (!conseil) {
        throw APIError.internal("Failed to create conseil");
      }

      // Add members
      for (const member of req.members) {
        await db.exec`
          INSERT INTO conseil_members (conseil_id, user_id, role, term_end_date, elected_at, active, created_at)
          VALUES (${conseil.id}, ${member.userId}, ${member.role}, ${member.termEndDate}, NOW(), true, NOW())
        `;
      }

      // Update building to reference conseil
      await db.exec`
        UPDATE buildings SET conseil_id = ${conseil.id}, updated_at = NOW()
        WHERE id = ${req.buildingId}
      `;

      // Fetch complete conseil data
      return await getConseilById(conseil.id);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to create conseil", error as Error);
    }
  }
);

async function getConseilById(conseilId: number): Promise<ConseilCopropriete> {
  const conseil = await db.queryRow`
    SELECT 
      c.id, c.building_id, c.president_id, c.created_at, c.updated_at,
      b.name as building_name
    FROM conseil_copropriete c
    JOIN buildings b ON c.building_id = b.id
    WHERE c.id = ${conseilId}
  `;

  if (!conseil) {
    throw APIError.notFound("Conseil not found");
  }

  const membersRows = await db.queryAll`
    SELECT 
      cm.id, cm.user_id, cm.role, cm.elected_at, cm.term_end_date, cm.active,
      u.first_name, u.last_name, u.email
    FROM conseil_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.conseil_id = ${conseilId} AND cm.active = true
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
}