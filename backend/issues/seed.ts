import { api } from "encore.dev/api";
import db from "../db";

interface SeedIssuesResponse {
  message: string;
  created: boolean;
}

export const seedIssues = api<{}, SeedIssuesResponse>(
  { expose: true, method: "POST", path: "/issues/seed" },
  async () => {
    try {
      const existingIssuesResult = await db.query`
        SELECT COUNT(*) as count FROM issues
      `;
      const existingIssues = [];
      for await (const row of existingIssuesResult) {
        existingIssues.push(row);
      }

      if (existingIssues[0]?.count > 0) {
        return {
          message: "Issues already exist",
          created: false
        };
      }

      // Get buildings, assets, admin user, and suppliers
      const buildingsResult = await db.query`SELECT id, name FROM buildings`;
      const buildings = [];
      for await (const row of buildingsResult) {
        buildings.push(row);
      }
      
      const assetsResult = await db.query`SELECT id, building_id, name, category FROM assets`;
      const assets = [];
      for await (const row of assetsResult) {
        assets.push(row);
      }
      
      const adminUser = await db.queryRow`SELECT id FROM users WHERE email = 'admin@demo.com'`;
      
      const suppliersResult = await db.query`SELECT id FROM suppliers`;
      const suppliers = [];
      for await (const row of suppliersResult) {
        suppliers.push(row);
      }

      if (!adminUser || buildings.length === 0 || suppliers.length === 0) {
        throw new Error("Required data not found. Please run other seeds first.");
      }

      const priorities = ["low", "medium", "high", "urgent"];
      const statuses = ["open", "assigned", "in_progress", "completed", "closed"];
      
      const issueTemplates = [
        {
          title: "Central HVAC System Inefficient Heating",
          description: "Residents on floors 5-8 report inconsistent heating with temperatures fluctuating between 65-72°F. The central air handler appears to be cycling irregularly, and some units are not reaching the thermostat setpoint.",
          priority: "high",
          category: "HVAC"
        },
        {
          title: "Major Water Leak in Basement Utility Room",
          description: "Significant water leak discovered near the main water distribution manifold in basement level B2. Water is pooling around electrical panels and storage areas. Emergency shutdown valve has been engaged.",
          priority: "urgent",
          category: "Plumbing"
        },
        {
          title: "Passenger Elevator #2 Irregular Operation",
          description: "Elevator car making grinding noises during ascent and occasionally stopping between floors 4-5. Emergency phone is functional. Building maintenance has temporarily limited use to freight only.",
          priority: "high",
          category: "Elevator"
        },
        {
          title: "Main Entrance CCTV System Failure",
          description: "Security camera array at primary entrance (cameras 1A, 1B, 1C) displaying corrupted video feed with intermittent signal loss. Night vision infrared illuminators not functioning properly.",
          priority: "medium",
          category: "Security"
        },
        {
          title: "Roof Membrane Damage After Storm Event",
          description: "Post-storm inspection revealed multiple punctures in EPDM roofing membrane near HVAC equipment area. Potential water infiltration points identified. Temporary tarping applied.",
          priority: "high",
          category: "Roof"
        },
        {
          title: "Emergency Lighting System Malfunction",
          description: "Battery backup emergency lighting in stairwells A and C not activating during power failure simulation. LED fixtures on floors 3, 7, and 9 require battery replacement.",
          priority: "medium",
          category: "Electrical"
        },
        {
          title: "Thermal Window Seal Failure - Unit 14B",
          description: "Double-pane thermal window in master bedroom showing condensation between glass panes indicating seal failure. Energy efficiency compromised, replacement required.",
          priority: "medium",
          category: "Windows"
        },
        {
          title: "Access Control System Malfunction",
          description: "Main entrance keycard reader intermittently rejecting valid access cards. Backup mechanical lock mechanism functioning normally. Software diagnostic recommended.",
          priority: "high",
          category: "Doors"
        },
        {
          title: "Fire Suppression System Annual Inspection",
          description: "Quarterly fire suppression system inspection and testing required per municipal code. Includes sprinkler heads, alarm panels, smoke detectors, and emergency communication systems.",
          priority: "medium",
          category: "Security"
        },
        {
          title: "Parking Garage LED Lighting Upgrade",
          description: "Multiple fluorescent fixtures in parking levels P1 and P2 have failed. Recommend upgrading to LED for improved energy efficiency and longer lifespan. Security lighting assessment included.",
          priority: "low",
          category: "Electrical"
        },
        {
          title: "Grease Trap Backup in Commercial Kitchen",
          description: "Grease trap in ground floor commercial kitchen area showing signs of backup and overflow. Professional cleaning and inspection required to prevent sanitary code violations.",
          priority: "medium",
          category: "Plumbing"
        },
        {
          title: "Rooftop HVAC Unit Refrigerant Leak",
          description: "HVAC Unit #3 (serving floors 8-12) showing low refrigerant levels and reduced cooling capacity. Potential refrigerant leak detected during routine maintenance. EPA-certified technician required.",
          priority: "high",
          category: "HVAC"
        },
        {
          title: "Water Pressure Irregularities - Upper Floors",
          description: "Residents on floors 15+ experiencing low water pressure during peak usage hours (7-9 AM, 6-8 PM). Main water pump pressure readings show fluctuation.",
          priority: "medium",
          category: "Plumbing"
        },
        {
          title: "Elevator Modernization Assessment Required",
          description: "Service elevator showing frequent service calls and aging control system. Recommendation for modernization assessment including controller upgrade and safety system evaluation.",
          priority: "low",
          category: "Elevator"
        },
        {
          title: "Security System Integration Upgrade",
          description: "Current security system lacks integration between access control, CCTV, and fire alarm systems. Upgrade required for centralized monitoring and emergency response coordination.",
          priority: "medium",
          category: "Security"
        },
        {
          title: "Roof Drain Cleaning and Inspection",
          description: "Seasonal roof drain maintenance required. Several drains showing debris accumulation that could cause water backup during heavy rainfall. Preventive cleaning recommended.",
          priority: "low",
          category: "Roof"
        },
        {
          title: "Power Distribution Panel Upgrade - East Wing",
          description: "Electrical panel in east wing showing signs of overloading during peak usage. Circuit breakers tripping intermittently. Load analysis and potential panel upgrade required.",
          priority: "high",
          category: "Electrical"
        },
        {
          title: "Window Replacement Project - South Facade",
          description: "Windows on south-facing facade (floors 5-10) showing weathering and reduced energy efficiency. Multi-unit replacement project recommended for optimal thermal performance.",
          priority: "low",
          category: "Windows"
        },
        {
          title: "Fire Door Annual Certification",
          description: "Fire-rated doors throughout building require annual inspection and certification. Includes self-closing mechanisms, door gaps, and hardware functionality assessment.",
          priority: "medium",
          category: "Doors"
        },
        {
          title: "Hot Water System Temperature Fluctuation",
          description: "Residents reporting inconsistent hot water temperature and extended wait times. Central hot water system may require circulation pump maintenance or tank temperature adjustment.",
          priority: "medium",
          category: "Plumbing"
        },
        {
          title: "Building Automation System Calibration",
          description: "HVAC control system sensors providing inconsistent readings. Temperature and humidity sensors require calibration for optimal building automation performance.",
          priority: "low",
          category: "HVAC"
        },
        {
          title: "Emergency Generator Monthly Test",
          description: "Monthly emergency generator load test and fuel system inspection. Includes transfer switch operation, battery condition, and coolant level verification.",
          priority: "medium",
          category: "Electrical"
        }
      ];

      const createdIssues = [];

      for (let i = 0; i < issueTemplates.length; i++) {
        const template = issueTemplates[i];
        const building = buildings[Math.floor(Math.random() * buildings.length)];
        
        // Find an asset that matches the category or pick random
        const matchingAssets = assets.filter(a => 
          a.building_id === building.id && 
          a.category.toLowerCase() === template.category.toLowerCase()
        );
        const asset = matchingAssets.length > 0 
          ? matchingAssets[Math.floor(Math.random() * matchingAssets.length)]
          : assets.filter(a => a.building_id === building.id)[0];

        // Randomly assign status and supplier
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const assignedSupplier = Math.random() > 0.3 ? suppliers[Math.floor(Math.random() * suppliers.length)] : null;
        
        // Generate costs and completion dates based on status
        let estimatedCost: number | null = null;
        let actualCost: number | null = null;
        let supplierRating: number | null = null;
        let completedAt: Date | null = null;
        let closedAt: Date | null = null;

        if (status !== "open") {
          estimatedCost = Math.floor(Math.random() * 2000) + 100;
        }

        if (status === "completed" || status === "closed") {
          actualCost = (estimatedCost || 0) + Math.floor(Math.random() * 500) - 250;
          supplierRating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
          
          const completedDate = new Date();
          completedDate.setDate(completedDate.getDate() - Math.floor(Math.random() * 30));
          completedAt = completedDate;
          
          if (status === "closed") {
            const closedDate = new Date(completedDate);
            closedDate.setDate(closedDate.getDate() + Math.floor(Math.random() * 7));
            closedAt = closedDate;
          }
        }

        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));

        const result = await db.queryRow`
          INSERT INTO issues (
            building_id, asset_id, title, description, priority, status,
            reported_by, assigned_to, estimated_cost, actual_cost,
            supplier_rating, created_at, completed_at, closed_at
          )
          VALUES (
            ${building.id}, ${asset?.id || null}, ${template.title}, ${template.description},
            ${template.priority}, ${status}, ${adminUser.id}, ${assignedSupplier?.id || null},
            ${estimatedCost}, ${actualCost}, ${supplierRating},
            ${createdDate.toISOString()}, ${completedAt?.toISOString() || null}, ${closedAt?.toISOString() || null}
          )
          RETURNING id
        `;

        if (result) {
          createdIssues.push(result.id);
        }
      }

      return {
        message: `${createdIssues.length} issues created successfully`,
        created: true
      };
    } catch (error) {
      console.error("Error seeding issues:", error);
      throw error;
    }
  }
);