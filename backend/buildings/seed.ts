import { api } from "encore.dev/api";
import db from "../db";

interface SeedBuildingsResponse {
  message: string;
  created: boolean;
}

export const seedBuildings = api<{}, SeedBuildingsResponse>(
  { expose: true, method: "POST", path: "/buildings/seed" },
  async () => {
    try {
      const existingBuildingsResult = await db.query`
        SELECT COUNT(*) as count FROM buildings
      `;
      const existingBuildings = [];
      for await (const row of existingBuildingsResult) {
        existingBuildings.push(row);
      }

      if (existingBuildings[0]?.count > 0) {
        return {
          message: "Buildings already exist",
          created: false
        };
      }

      // Get demo admin user
      const adminUser = await db.queryRow`
        SELECT id FROM users WHERE email = 'admin@demo.com'
      `;

      if (!adminUser) {
        throw new Error("Demo admin user not found. Please run auth seed first.");
      }

      // Create buildings with more realistic data
      const buildings = [
        {
          name: "Metropolitan Heights",
          address: "1247 Madison Avenue, Upper East Side, New York, NY 10128",
          units_count: 48,
          syndic_id: adminUser.id
        },
        {
          name: "Harbor View Residences",
          address: "2850 Waterfront Boulevard, San Francisco, CA 94123",
          units_count: 32,
          syndic_id: adminUser.id
        },
        {
          name: "The Meridian Tower",
          address: "901 Michigan Avenue, Chicago, IL 60611",
          units_count: 84,
          syndic_id: adminUser.id
        },
        {
          name: "Sunset Garden Apartments",
          address: "4567 Sunset Strip, West Hollywood, CA 90069",
          units_count: 28,
          syndic_id: adminUser.id
        },
        {
          name: "Cedar Creek Commons",
          address: "180 Commonwealth Avenue, Boston, MA 02116",
          units_count: 36,
          syndic_id: adminUser.id
        },
        {
          name: "Riverside Lofts",
          address: "3421 Riverfront Drive, Portland, OR 97204",
          units_count: 22,
          syndic_id: adminUser.id
        },
        {
          name: "Park Plaza Condominiums",
          address: "7890 Park Avenue South, Miami, FL 33139",
          units_count: 56,
          syndic_id: adminUser.id
        },
        {
          name: "Heritage Square Apartments",
          address: "1555 Heritage Lane, Austin, TX 78701",
          units_count: 40,
          syndic_id: adminUser.id
        }
      ];

      const buildingIds = [];
      
      for (const building of buildings) {
        const result = await db.queryRow`
          INSERT INTO buildings (name, address, units_count, syndic_id)
          VALUES (${building.name}, ${building.address}, ${building.units_count}, ${building.syndic_id})
          RETURNING id
        `;
        if (result) {
          buildingIds.push(result.id);
        }
      }

      // Create realistic assets for each building
      const assetTemplates = [
        { category: "HVAC", names: ["Central Air Handler", "Rooftop HVAC Unit", "Boiler System", "Heat Pump", "Ventilation Fan", "Air Conditioning Compressor"] },
        { category: "Electrical", names: ["Main Electrical Panel", "Emergency Generator", "Fire Alarm Control Panel", "Lighting Control System", "Security Lighting", "Elevator Power System"] },
        { category: "Plumbing", names: ["Water Heater", "Main Water Pump", "Sump Pump", "Backflow Preventer", "Water Pressure Tank", "Grease Trap"] },
        { category: "Security", names: ["Access Control System", "CCTV Camera Network", "Intercom System", "Keycard Reader", "Motion Detector", "Panic Button System"] },
        { category: "Elevator", names: ["Passenger Elevator", "Service Elevator", "Elevator Motor", "Emergency Phone System", "Door Operator", "Elevator Controller"] },
        { category: "Roof", names: ["Membrane Roofing", "Gutter System", "Roof Drain", "Skylight", "Roof Access Hatch", "HVAC Roof Supports"] },
        { category: "Windows", names: ["Double-Pane Windows", "Emergency Exit Windows", "Lobby Windows", "Stairwell Windows", "Fire Escape Windows", "Skylight Windows"] },
        { category: "Doors", names: ["Main Entrance Door", "Fire Exit Door", "Service Door", "Garage Door", "Security Door", "Emergency Exit Door"] }
      ];
      
      for (let i = 0; i < buildingIds.length; i++) {
        const buildingId = buildingIds[i];
        const buildingName = buildings[i].name;
        
        // Create 12-20 assets per building for more realism
        const assetsToCreate = Math.floor(Math.random() * 9) + 12;
        
        for (let j = 0; j < assetsToCreate; j++) {
          const categoryTemplate = assetTemplates[Math.floor(Math.random() * assetTemplates.length)];
          const assetName = categoryTemplate.names[Math.floor(Math.random() * categoryTemplate.names.length)];
          const systemNumber = Math.floor(Math.random() * 5) + 1;
          
          // Generate realistic warranty and maintenance dates
          const warrantyExpiry = new Date();
          warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + Math.floor(Math.random() * 4) + 1); // 1-5 years
          
          const lastMaintenance = new Date();
          lastMaintenance.setMonth(lastMaintenance.getMonth() - Math.floor(Math.random() * 6)); // 0-6 months ago
          
          // Create more detailed descriptions
          const descriptions: Record<string, string> = {
            "HVAC": `Climate control system providing heating, ventilation, and air conditioning for ${buildingName}. Model: ${systemNumber}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            "Electrical": `Electrical infrastructure component ensuring reliable power distribution throughout ${buildingName}. Circuit: ${systemNumber}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            "Plumbing": `Water and waste management system component for ${buildingName}. Zone: ${systemNumber}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            "Security": `Security and access control system protecting ${buildingName} and its residents. Unit: ${systemNumber}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            "Elevator": `Vertical transportation system component for ${buildingName}. Elevator ${systemNumber}`,
            "Roof": `Roofing and weatherproofing component protecting ${buildingName}. Section: ${systemNumber}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            "Windows": `Window system providing natural light and ventilation for ${buildingName}. Bank: ${systemNumber}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            "Doors": `Access control and security door system for ${buildingName}. Entry Point: ${systemNumber}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
          };
          
          await db.query`
            INSERT INTO assets (building_id, name, category, description, warranty_expiry, last_maintenance)
            VALUES (
              ${buildingId},
              ${`${assetName} #${systemNumber}`},
              ${categoryTemplate.category},
              ${descriptions[categoryTemplate.category]},
              ${warrantyExpiry.toISOString().split('T')[0]},
              ${lastMaintenance.toISOString().split('T')[0]}
            )
          `;
        }
      }

      return {
        message: `${buildings.length} buildings with assets created successfully`,
        created: true
      };
    } catch (error) {
      console.error("Error seeding buildings:", error);
      throw error;
    }
  }
);