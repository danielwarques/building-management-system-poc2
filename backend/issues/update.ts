import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

interface UpdateIssueParams {
  id: number;
}

interface UpdateIssueRequest {
  status?: "open" | "assigned" | "in_progress" | "completed" | "closed";
  assignedTo?: number;
  estimatedCost?: number;
  actualCost?: number;
  supplierRating?: number;
}

interface UpdateIssueResponse {
  id: number;
  status: string;
  updatedAt: string;
}

// Updates an existing issue status or assignment.
export const update = api<UpdateIssueParams & UpdateIssueRequest, UpdateIssueResponse>(
  { expose: true, method: "PATCH", path: "/issues/:id" },
  async (req) => {
    const issue = await db.queryRow`
      SELECT i.*, s.user_id as supplier_user_id
      FROM issues i
      LEFT JOIN suppliers s ON i.assigned_to = s.id
      WHERE i.id = ${req.id}
    `;

    if (!issue) {
      throw APIError.notFound("issue not found");
    }

    let updateFields: string[] = [];
    let updateValues: any[] = [];
    let paramIndex = 1;

    if (req.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(req.status);

      if (req.status === "completed") {
        updateFields.push(`completed_at = NOW()`);
      } else if (req.status === "closed") {
        updateFields.push(`closed_at = NOW()`);
      }
    }

    if (req.assignedTo !== undefined) {
      updateFields.push(`assigned_to = $${paramIndex++}`);
      updateValues.push(req.assignedTo);
    }

    if (req.estimatedCost !== undefined) {
      updateFields.push(`estimated_cost = $${paramIndex++}`);
      updateValues.push(req.estimatedCost);
    }

    if (req.actualCost !== undefined) {
      updateFields.push(`actual_cost = $${paramIndex++}`);
      updateValues.push(req.actualCost);
    }

    if (req.supplierRating !== undefined) {
      updateFields.push(`supplier_rating = $${paramIndex++}`);
      updateValues.push(req.supplierRating);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(req.id);

    const query = `
      UPDATE issues 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, status, updated_at
    `;

    const updatedIssue = await db.rawQueryRow(query, ...updateValues);

    if (!updatedIssue) {
      throw APIError.internal("failed to update issue");
    }

    return {
      id: updatedIssue.id,
      status: updatedIssue.status,
      updatedAt: updatedIssue.updated_at,
    };
  }
);
