import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { SupervisionRequest, Supervision } from "./types";

export const createSupervision = api(
  { method: "POST", path: "/conseil/supervise", expose: true, auth: true },
  async (req: SupervisionRequest): Promise<Supervision> => {
    const auth = getAuthData();
    if (!auth) {
      throw APIError.unauthenticated("Authentication required");
    }

    try {
      // Verify user is a conseil member for this building
      const conseilMember = await db.queryRow`
        SELECT cm.id
        FROM conseil_members cm
        JOIN conseil_copropriete c ON cm.conseil_id = c.id
        WHERE c.building_id = ${req.buildingId} 
          AND cm.user_id = ${parseInt(auth.userID)} 
          AND cm.active = true
      `;

      if (!conseilMember) {
        throw APIError.permissionDenied("Only conseil members can create supervisions");
      }

      // Get conseil ID for this building
      const conseil = await db.queryRow`
        SELECT id FROM conseil_copropriete WHERE building_id = ${req.buildingId}
      `;

      if (!conseil) {
        throw APIError.notFound("Conseil not found for this building");
      }

      // Create supervision
      const supervision = await db.queryRow`
        INSERT INTO syndic_supervisions 
        (building_id, conseil_id, supervision_type, description, status, created_by, created_at, updated_at)
        VALUES (${req.buildingId}, ${conseil.id}, ${req.supervisionType}, ${req.description}, 'pending', ${parseInt(auth.userID)}, NOW(), NOW())
        RETURNING id, building_id, conseil_id, supervision_type, description, status, reviewed_by, created_by, created_at, updated_at
      `;

      if (!supervision) {
        throw APIError.internal("Failed to create supervision");
      }

      return {
        id: supervision.id,
        buildingId: supervision.building_id,
        conseilId: supervision.conseil_id,
        supervisionType: supervision.supervision_type,
        description: supervision.description,
        status: supervision.status,
        reviewedBy: supervision.reviewed_by,
        createdBy: supervision.created_by,
        createdAt: supervision.created_at,
        updatedAt: supervision.updated_at
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to create supervision", error as Error);
    }
  }
);

interface UpdateSupervisionRequest {
  supervisionId: number;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
}

export const updateSupervision = api(
  { method: "PUT", path: "/conseil/supervise/:supervisionId", expose: true, auth: true },
  async ({ supervisionId, status }: UpdateSupervisionRequest): Promise<Supervision> => {
    const auth = getAuthData();
    if (!auth) {
      throw APIError.unauthenticated("Authentication required");
    }

    try {
      // Verify supervision exists and user has permission
      const supervision = await db.queryRow`
        SELECT s.*, cm.id as member_id
        FROM syndic_supervisions s
        JOIN conseil_copropriete c ON s.conseil_id = c.id
        LEFT JOIN conseil_members cm ON cm.conseil_id = c.id AND cm.user_id = ${parseInt(auth.userID)} AND cm.active = true
        WHERE s.id = ${supervisionId}
      `;

      if (!supervision) {
        throw APIError.notFound("Supervision not found");
      }

      // Check if user is conseil member or syndic for this building
      const hasPermission = supervision.member_id || auth.userType === 'syndic' || auth.userType === 'administrator';
      
      if (!hasPermission) {
        throw APIError.permissionDenied("Insufficient permissions to update supervision");
      }

      // Update supervision
      const updated = await db.queryRow`
        UPDATE syndic_supervisions 
        SET status = ${status}, reviewed_by = ${parseInt(auth.userID)}, updated_at = NOW()
        WHERE id = ${supervisionId}
        RETURNING id, building_id, conseil_id, supervision_type, description, status, reviewed_by, created_by, created_at, updated_at
      `;

      if (!updated) {
        throw APIError.notFound("Supervision not found");
      }

      return {
        id: updated.id,
        buildingId: updated.building_id,
        conseilId: updated.conseil_id,
        supervisionType: updated.supervision_type,
        description: updated.description,
        status: updated.status,
        reviewedBy: updated.reviewed_by,
        createdBy: updated.created_by,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to update supervision", error as Error);
    }
  }
);

interface ListSupervisionsRequest {
  buildingId: number;
}

interface ListSupervisionsResponse {
  supervisions: Supervision[];
}

export const listSupervisions = api(
  { method: "GET", path: "/conseil/:buildingId/supervisions", expose: true, auth: true },
  async ({ buildingId }: ListSupervisionsRequest): Promise<ListSupervisionsResponse> => {
    try {
      const supervisionsRows = await db.queryAll`
        SELECT id, building_id, conseil_id, supervision_type, description, status, reviewed_by, created_by, created_at, updated_at
        FROM syndic_supervisions 
        WHERE building_id = ${buildingId}
        ORDER BY created_at DESC
      `;

      const supervisions = Array.from(supervisionsRows);

      return {
        supervisions: supervisions.map((s: any) => ({
          id: s.id,
          buildingId: s.building_id,
          conseilId: s.conseil_id,
          supervisionType: s.supervision_type,
          description: s.description,
          status: s.status,
          reviewedBy: s.reviewed_by,
          createdBy: s.created_by,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }))
      };
    } catch (error) {
      throw APIError.internal("Failed to list supervisions", error as Error);
    }
  }
);