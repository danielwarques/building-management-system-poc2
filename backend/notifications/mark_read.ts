import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface MarkReadParams {
  id: number;
}

// Marks a notification as read.
export const markRead = api<MarkReadParams, void>(
  { expose: true, method: "PATCH", path: "/notifications/:id/read", auth: true },
  async (params) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    
    const result = await db.exec`
      UPDATE notifications 
      SET read = true 
      WHERE id = ${params.id} AND user_id = ${userId}
    `;

    // Note: In a real app, we'd check if the update affected any rows
    // For this PoC, we'll assume success if no error was thrown
  }
);
