import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import db from "../db";

interface ListIssuesParams {
  buildingId?: Query<number>;
  status?: Query<string>;
  limit?: Query<number>;
}

interface Issue {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  buildingName: string;
  assetName: string | null;
  reportedBy: string;
  assignedTo: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ListIssuesResponse {
  issues: Issue[];
}

// Retrieves all issues.
export const list = api<ListIssuesParams, ListIssuesResponse>(
  { expose: true, method: "GET", path: "/issues" },
  async (params) => {
    const limit = params.limit || 50;

    let whereClause = "";
    let queryParams: any[] = [];

    // Additional filters
    if (params.buildingId) {
      whereClause += ` AND i.building_id = $${queryParams.length + 1}`;
      queryParams.push(params.buildingId);
    }

    if (params.status) {
      whereClause += ` AND i.status = $${queryParams.length + 1}`;
      queryParams.push(params.status);
    }

    const query = `
      SELECT i.id, i.title, i.description, i.priority, i.status,
             b.name as building_name,
             a.name as asset_name,
             CONCAT(reporter.first_name, ' ', reporter.last_name) as reported_by,
             COALESCE(s.company_name, CONCAT(s.first_name, ' ', s.last_name)) as assigned_to,
             i.estimated_cost, i.actual_cost, i.created_at, i.updated_at
      FROM issues i
      INNER JOIN buildings b ON i.building_id = b.id
      LEFT JOIN assets a ON i.asset_id = a.id
      INNER JOIN building_owners reporter ON i.reported_by = reporter.id
      LEFT JOIN suppliers s ON i.assigned_to = s.id
      WHERE 1=1 ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${queryParams.length + 1}
    `;

    queryParams.push(limit);

    const rows = await db.rawQueryAll(query, ...queryParams);

    const issues: Issue[] = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      buildingName: row.building_name,
      assetName: row.asset_name,
      reportedBy: row.reported_by,
      assignedTo: row.assigned_to,
      estimatedCost: row.estimated_cost,
      actualCost: row.actual_cost,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { issues };
  }
);
