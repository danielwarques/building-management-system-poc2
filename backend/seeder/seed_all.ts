import { api } from "encore.dev/api";

interface SeedAllResponse {
  message: string;
  results: Array<{
    service: string;
    success: boolean;
    message: string;
  }>;
}

export const seedAll = api<{}, SeedAllResponse>(
  { expose: true, method: "POST", path: "/seed-all" },
  async () => {
    const results: Array<{ service: string; success: boolean; message: string }> = [];

    try {
      // 1. Seed demo users first
      try {
        const authResponse = await fetch(`${process.env.ENCORE_API_URL || 'http://localhost:4000'}/auth/seed-demo`, {
          method: 'POST'
        });
        const authData = await authResponse.json() as { message?: string };
        results.push({
          service: "auth",
          success: authResponse.ok,
          message: authData.message || "Users seeded"
        });
      } catch (error) {
        results.push({
          service: "auth",
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // 2. Seed buildings
      try {
        const buildingsResponse = await fetch(`${process.env.ENCORE_API_URL || 'http://localhost:4000'}/buildings/seed`, {
          method: 'POST'
        });
        const buildingsData = await buildingsResponse.json() as { message?: string };
        results.push({
          service: "buildings",
          success: buildingsResponse.ok,
          message: buildingsData.message || "Buildings seeded"
        });
      } catch (error) {
        results.push({
          service: "buildings",
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // 3. Seed suppliers
      try {
        const suppliersResponse = await fetch(`${process.env.ENCORE_API_URL || 'http://localhost:4000'}/suppliers/seed`, {
          method: 'POST'
        });
        const suppliersData = await suppliersResponse.json() as { message?: string };
        results.push({
          service: "suppliers",
          success: suppliersResponse.ok,
          message: suppliersData.message || "Suppliers seeded"
        });
      } catch (error) {
        results.push({
          service: "suppliers",
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // 4. Seed owner users
      try {
        const ownersResponse = await fetch(`${process.env.ENCORE_API_URL || 'http://localhost:4000'}/owners/seed`, {
          method: 'POST'
        });
        const ownersData = await ownersResponse.json() as { message?: string };
        results.push({
          service: "owners",
          success: ownersResponse.ok,
          message: ownersData.message || "Owner users seeded"
        });
      } catch (error) {
        results.push({
          service: "owners",
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // 5. Seed units and ownerships
      try {
        const unitsResponse = await fetch(`${process.env.ENCORE_API_URL || 'http://localhost:4000'}/units/seed`, {
          method: 'POST'
        });
        const unitsData = await unitsResponse.json() as { message?: string };
        results.push({
          service: "units",
          success: unitsResponse.ok,
          message: unitsData.message || "Units and ownerships seeded"
        });
      } catch (error) {
        results.push({
          service: "units",
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // 6. Seed issues
      try {
        const issuesResponse = await fetch(`${process.env.ENCORE_API_URL || 'http://localhost:4000'}/issues/seed`, {
          method: 'POST'
        });
        const issuesData = await issuesResponse.json() as { message?: string };
        results.push({
          service: "issues",
          success: issuesResponse.ok,
          message: issuesData.message || "Issues seeded"
        });
      } catch (error) {
        results.push({
          service: "issues",
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // 7. Seed notifications
      try {
        const notificationsResponse = await fetch(`${process.env.ENCORE_API_URL || 'http://localhost:4000'}/notifications/seed`, {
          method: 'POST'
        });
        const notificationsData = await notificationsResponse.json() as { message?: string };
        results.push({
          service: "notifications",
          success: notificationsResponse.ok,
          message: notificationsData.message || "Notifications seeded"
        });
      } catch (error) {
        results.push({
          service: "notifications",
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        message: `Seeding completed: ${successCount}/${totalCount} services seeded successfully`,
        results
      };

    } catch (error) {
      console.error("Error in seed all:", error);
      throw error;
    }
  }
);