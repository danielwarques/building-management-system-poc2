import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface ListNotificationsParams {
  unreadOnly?: Query<boolean>;
  limit?: Query<number>;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
}

interface ListNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Retrieves all notifications.
export const list = api<ListNotificationsParams, ListNotificationsResponse>(
  { expose: true, method: "GET", path: "/notifications", auth: true },
  async (params) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    const limit = params.limit || 20;

    let whereClause = "WHERE user_id = $1";
    let queryParams: any[] = [userId];

    if (params.unreadOnly) {
      whereClause += " AND read = false";
    }

    const notifications = await db.rawQueryAll(
      `SELECT id, title, message, type, reference_id, read, created_at
       FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${queryParams.length + 1}`,
      ...queryParams,
      limit
    );

    const unreadCount = await db.rawQueryRow(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false",
      userId
    );

    return {
      notifications: notifications.map((notif: any) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        referenceId: notif.reference_id,
        read: notif.read,
        createdAt: notif.created_at,
      })),
      unreadCount: parseInt(unreadCount?.count || "0"),
    };
  }
);
