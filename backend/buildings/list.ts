import { api } from "encore.dev/api";
import db from "../db";

interface Building {
  id: number;
  name: string;
  address: string;
  unitsCount: number;
  syndicName: string;
  syndicType: string;
  syndicCompanyName?: string;
  syndicContactEmail?: string;
  hasConseil: boolean;
  conseilPresidentName?: string;
}

interface ListBuildingsResponse {
  buildings: Building[];
}

// Retrieves all buildings.
export const list = api<void, ListBuildingsResponse>(
  { expose: true, method: "GET", path: "/buildings", auth: true },
  async () => {
    const query = `
      SELECT 
        b.id, b.name, b.address, b.units_count,
        b.syndic_type, b.syndic_company_name, b.syndic_contact_email,
        CONCAT(u.first_name, ' ', u.last_name) as syndic_name,
        CASE WHEN c.id IS NOT NULL THEN true ELSE false END as has_conseil,
        CONCAT(president.first_name, ' ', president.last_name) as conseil_president_name
      FROM buildings b
      LEFT JOIN users u ON b.syndic_id = u.id
      LEFT JOIN conseil_copropriete c ON b.conseil_id = c.id
      LEFT JOIN conseil_members cm ON c.id = cm.conseil_id AND cm.role = 'president' AND cm.active = true
      LEFT JOIN users president ON cm.user_id = president.id
      ORDER BY b.name
    `;

    const rows = await db.rawQueryAll(query);

    const buildings: Building[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      unitsCount: row.units_count,
      syndicName: row.syndic_name || "No Syndic",
      syndicType: row.syndic_type,
      syndicCompanyName: row.syndic_company_name,
      syndicContactEmail: row.syndic_contact_email,
      hasConseil: row.has_conseil,
      conseilPresidentName: row.conseil_president_name,
    }));

    return { buildings };
  }
);
