import { api } from "encore.dev/api";
import db from "../db";

interface ToggleUserRequest {
  userId: number;
  userType: 'building_owner' | 'syndic' | 'administrator';
  active: boolean;
}

interface ToggleUserResponse {
  success: boolean;
  message: string;
}

export const toggleUser = api(
  { method: "PATCH", path: "/auth/users/toggle", expose: true },
  async ({ userId, userType, active }: ToggleUserRequest): Promise<ToggleUserResponse> => {
    let user;
    
    if (userType === 'building_owner') {
      user = await db.queryRow`
        UPDATE building_owners 
        SET active = ${active}, updated_at = NOW() 
        WHERE id = ${userId}
        RETURNING id, email, active
      `;
    } else if (userType === 'syndic') {
      user = await db.queryRow`
        UPDATE syndics 
        SET active = ${active}, updated_at = NOW() 
        WHERE id = ${userId}
        RETURNING id, email, active
      `;
    } else if (userType === 'administrator') {
      user = await db.queryRow`
        UPDATE administrators 
        SET active = ${active}, updated_at = NOW() 
        WHERE id = ${userId}
        RETURNING id, email, active
      `;
    }

    if (!user) {
      throw new Error("User not found");
    }

    return {
      success: true,
      message: `User ${active ? 'activated' : 'deactivated'} successfully`,
    };
  }
);