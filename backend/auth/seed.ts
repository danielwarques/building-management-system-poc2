import { api } from "encore.dev/api";
import * as bcrypt from "bcryptjs";
import db from "../db";

interface SeedResponse {
  message: string;
  created: boolean;
}

export const seedDemoUsers = api<{}, SeedResponse>(
  { expose: true, method: "POST", path: "/auth/seed-demo" },
  async () => {
    try {
      // Check if demo users already exist in any of the user tables
      const existingAdminsResult = await db.queryRow`
        SELECT COUNT(*) as count FROM administrators WHERE email LIKE '%@demo.com'
      `;
      const existingSyndicsResult = await db.queryRow`
        SELECT COUNT(*) as count FROM syndics WHERE email LIKE '%@demo.com'
      `;
      const existingOwnersResult = await db.queryRow`
        SELECT COUNT(*) as count FROM building_owners WHERE email LIKE '%@demo.com'
      `;

      const totalExisting = (existingAdminsResult?.count || 0) + 
                           (existingSyndicsResult?.count || 0) + 
                           (existingOwnersResult?.count || 0);

      if (totalExisting > 0) {
        return {
          message: "Demo users already exist",
          created: false
        };
      }

      const hashedPassword = await bcrypt.hash("password", 12);

      // Create administrators
      const adminUsers = [
        {
          email: "admin@demo.com",
          firstName: "Demo",
          lastName: "Admin",
          phone: "+1-555-0001"
        }
      ];

      const adminIds = [];
      for (const user of adminUsers) {
        const result = await db.queryRow`
          INSERT INTO administrators (email, password_hash, first_name, last_name, phone, active)
          VALUES (${user.email}, ${hashedPassword}, ${user.firstName}, ${user.lastName}, ${user.phone}, true)
          RETURNING id
        `;
        if (result) {
          adminIds.push(result.id);
        }
      }

      // Create syndics
      const syndicUsers = [
        {
          email: "syndic1@demo.com",
          firstName: "Marie",
          lastName: "Dubois",
          phone: "+1-555-0002",
          companyName: "Dubois Property Management"
        },
        {
          email: "syndic2@demo.com",
          firstName: "Pierre",
          lastName: "Martin",
          phone: "+1-555-0003",
          companyName: "Martin & Associates"
        }
      ];

      const syndicIds = [];
      for (const user of syndicUsers) {
        const result = await db.queryRow`
          INSERT INTO syndics (email, password_hash, first_name, last_name, company_name, phone, active)
          VALUES (${user.email}, ${hashedPassword}, ${user.firstName}, ${user.lastName}, ${user.companyName}, ${user.phone}, true)
          RETURNING id
        `;
        if (result) {
          syndicIds.push(result.id);
        }
      }

      // Create building owners
      const ownerUsers = [
        {
          email: "owner1@demo.com",
          firstName: "Sophie",
          lastName: "Laurent",
          phone: "+1-555-0004"
        },
        {
          email: "owner2@demo.com",
          firstName: "Jean",
          lastName: "Bernard",
          phone: "+1-555-0005"
        },
        {
          email: "owner3@demo.com",
          firstName: "Claire",
          lastName: "Moreau",
          phone: "+1-555-0006"
        }
      ];

      const ownerIds = [];
      for (const user of ownerUsers) {
        const result = await db.queryRow`
          INSERT INTO building_owners (email, password_hash, first_name, last_name, phone, active)
          VALUES (${user.email}, ${hashedPassword}, ${user.firstName}, ${user.lastName}, ${user.phone}, true)
          RETURNING id
        `;
        if (result) {
          ownerIds.push(result.id);
        }
      }

      const totalCreated = adminIds.length + syndicIds.length + ownerIds.length;

      return {
        message: `${totalCreated} demo users created successfully (${adminIds.length} administrators, ${syndicIds.length} syndics, ${ownerIds.length} building owners)`,
        created: true
      };
    } catch (error) {
      console.error("Error creating demo users:", error);
      throw error;
    }
  }
);