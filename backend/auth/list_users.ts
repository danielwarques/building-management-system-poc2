import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'building_owner' | 'syndic' | 'administrator';
  phone?: string;
  companyName?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ListUsersResponse {
  buildingOwners: User[];
  syndics: User[];
  administrators: User[];
}

export const listUsers = api(
  { method: "GET", path: "/auth/users", expose: true },
  async (): Promise<ListUsersResponse> => {
    console.log("Fetching user list - no auth required for debugging");
    try {
      console.log("Fetching users from database...");
      
      // Get building owners
      let ownerRows: any[] = [];
      try {
        ownerRows = await db.rawQueryAll(`
          SELECT 
            id, email, first_name, last_name, phone, active, created_at, updated_at, 'building_owner' as user_type
          FROM building_owners 
          ORDER BY created_at DESC
        `);
        console.log("Building owners fetched:", ownerRows.length);
      } catch (error) {
        console.error("Error fetching building owners:", error);
        ownerRows = [];
      }

      // Get syndics
      let syndicRows: any[] = [];
      try {
        syndicRows = await db.rawQueryAll(`
          SELECT 
            id, email, first_name, last_name, company_name, phone, active, created_at, updated_at, 'syndic' as user_type
          FROM syndics 
          ORDER BY created_at DESC
        `);
        console.log("Syndics fetched:", syndicRows.length);
      } catch (error) {
        console.error("Error fetching syndics:", error);
        syndicRows = [];
      }

      // Get administrators
      let adminRows: any[] = [];
      try {
        adminRows = await db.rawQueryAll(`
          SELECT 
            id, email, first_name, last_name, phone, active, created_at, updated_at, 'administrator' as user_type
          FROM administrators 
          ORDER BY created_at DESC
        `);
        console.log("Administrators fetched:", adminRows.length);
      } catch (error) {
        console.error("Error fetching administrators:", error);
        adminRows = [];
      }

    const buildingOwners = ownerRows.map((row: any) => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      userType: row.user_type as 'building_owner',
      phone: row.phone,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const syndics = syndicRows.map((row: any) => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      userType: row.user_type as 'syndic',
      phone: row.phone,
      companyName: row.company_name,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const administrators = adminRows.map((row: any) => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      userType: row.user_type as 'administrator',
      phone: row.phone,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    console.log("Returning users:", {
      buildingOwners: buildingOwners.length,
      syndics: syndics.length,
      administrators: administrators.length
    });

    return { buildingOwners, syndics, administrators };
    } catch (error) {
      console.error("Error fetching users:", error);
      
      // If tables don't exist, return empty arrays
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message;
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          console.log("Tables don't exist yet, returning empty arrays");
          return { buildingOwners: [], syndics: [], administrators: [] };
        }
      }
      
      throw error;
    }
  }
);