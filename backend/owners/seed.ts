import { api } from "encore.dev/api";
import db from "../db";
import * as bcrypt from "bcryptjs";

export const seed = api(
  { method: "POST", path: "/owners/seed", expose: true },
  async (): Promise<{ message: string; ownersCreated: number }> => {
    const ownerData = [
      { firstName: "Marie", lastName: "Dubois", email: "marie.dubois@example.com", phone: "+32 456 78 90 12" },
      { firstName: "Jean", lastName: "Martin", email: "jean.martin@example.com", phone: "+32 456 78 90 13" },
      { firstName: "Sophie", lastName: "Bernard", email: "sophie.bernard@example.com", phone: "+32 456 78 90 14" },
      { firstName: "Pierre", lastName: "Moreau", email: "pierre.moreau@example.com", phone: "+32 456 78 90 15" },
      { firstName: "Isabelle", lastName: "Petit", email: "isabelle.petit@example.com", phone: "+32 456 78 90 16" },
      { firstName: "Michel", lastName: "Durand", email: "michel.durand@example.com", phone: "+32 456 78 90 17" },
      { firstName: "Catherine", lastName: "Leroy", email: "catherine.leroy@example.com", phone: "+32 456 78 90 18" },
      { firstName: "François", lastName: "Roux", email: "francois.roux@example.com", phone: "+32 456 78 90 19" },
      { firstName: "Nathalie", lastName: "Vincent", email: "nathalie.vincent@example.com", phone: "+32 456 78 90 20" },
      { firstName: "Philippe", lastName: "Fournier", email: "philippe.fournier@example.com", phone: "+32 456 78 90 21" },
      { firstName: "Valérie", lastName: "Michel", email: "valerie.michel@example.com", phone: "+32 456 78 90 22" },
      { firstName: "Alain", lastName: "André", email: "alain.andre@example.com", phone: "+32 456 78 90 23" },
      { firstName: "Sylvie", lastName: "Fernandez", email: "sylvie.fernandez@example.com", phone: "+32 456 78 90 24" },
      { firstName: "Thierry", lastName: "Blanchard", email: "thierry.blanchard@example.com", phone: "+32 456 78 90 25" },
      { firstName: "Martine", lastName: "Girard", email: "martine.girard@example.com", phone: "+32 456 78 90 26" },
    ];

    let ownersCreated = 0;
    const defaultPassword = await bcrypt.hash("password123", 10);

    for (const owner of ownerData) {
      try {
        // Check if owner already exists
        const existingUser = await db.queryRow`
          SELECT id FROM users WHERE email = ${owner.email}
        `;

        if (!existingUser) {
          await db.queryRow`
            INSERT INTO users (
              email, password_hash, first_name, last_name, role, phone, active
            ) VALUES (${owner.email}, ${defaultPassword}, ${owner.firstName}, ${owner.lastName}, 'owner', ${owner.phone}, true)
          `;
          ownersCreated++;
        }
      } catch (error) {
        console.error(`Error creating owner ${owner.firstName} ${owner.lastName}:`, error);
      }
    }

    return {
      message: `Successfully created ${ownersCreated} owner users`,
      ownersCreated,
    };
  }
);