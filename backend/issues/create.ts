import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CreateIssueRequest {
  buildingId: number;
  assetId?: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
}

interface CreateIssueResponse {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
}

// Creates a new issue or maintenance request.
export const create = api<CreateIssueRequest, CreateIssueResponse>(
  { expose: true, method: "POST", path: "/issues", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    if (req.assetId) {
      const asset = await db.queryRow`
        SELECT 1 FROM assets
        WHERE id = ${req.assetId} AND building_id = ${req.buildingId}
      `;
      if (!asset) {
        throw APIError.invalidArgument("asset does not belong to the specified building");
      }
    }

    const reporterId = parseInt(auth.userID);
    if (isNaN(reporterId)) {
      throw APIError.invalidArgument("invalid user ID");
    }

    try {
      await db.exec`BEGIN`;

      const issue = await db.queryRow`
        INSERT INTO issues (building_id, asset_id, title, description, priority, status, reported_by)
        VALUES (${req.buildingId}, ${req.assetId}, ${req.title}, ${req.description}, ${req.priority}, 'open', ${reporterId})
        RETURNING id, title, description, priority, status, created_at
      `;

      if (!issue) {
        await db.exec`ROLLBACK`;
        throw APIError.internal("failed to create issue");
      }

      const building = await db.queryRow`
        SELECT syndic_id FROM buildings WHERE id = ${req.buildingId}
      `;

      if (building?.syndic_id) {
        await db.exec`
          INSERT INTO notifications (user_id, user_type, title, message, type, reference_id)
          VALUES (${building.syndic_id}, 'syndic', 'New Issue Reported', ${`New issue "${req.title}" reported in building`}, 'issue', ${issue.id})
        `;
      }

      await db.exec`COMMIT`;

      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        createdAt: issue.created_at,
      };
    } catch (error) {
      await db.exec`ROLLBACK`;
      throw error;
    }
  }
);
