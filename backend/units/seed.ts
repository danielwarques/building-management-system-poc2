import { api } from "encore.dev/api";
import db from "../db";

export const seed = api(
  { method: "POST", path: "/units/seed", expose: true },
  async (): Promise<{ message: string; unitsCreated: number; ownershipsCreated: number }> => {
    // Get existing buildings
    const buildings = await db.rawQueryAll(`
      SELECT id, name FROM buildings ORDER BY id LIMIT 3
    `);

    if (buildings.length === 0) {
      throw new Error("No buildings found. Please seed buildings first.");
    }

    let unitsCreated = 0;
    let ownershipsCreated = 0;

    // Get some owner users
    const owners = await db.rawQueryAll(`
      SELECT id, first_name, last_name FROM users WHERE role = 'owner' LIMIT 10
    `);

    if (owners.length === 0) {
      throw new Error("No owner users found. Please create owner users first.");
    }

    // Create units for each building
    for (const building of buildings) {
      const unitsPerBuilding = Math.floor(Math.random() * 8) + 8; // 8-15 units per building
      
      for (let i = 1; i <= unitsPerBuilding; i++) {
        const floor = Math.floor((i - 1) / 4) + 1; // 4 units per floor
        const unitOnFloor = ((i - 1) % 4) + 1;
        const unitNumber = `${floor}${unitOnFloor.toString().padStart(2, '0')}`;
        
        const unitTypes = ['apartment', 'commercial', 'garage', 'storage'];
        const unitType = i <= unitsPerBuilding - 2 ? 'apartment' : unitTypes[Math.floor(Math.random() * unitTypes.length)];
        
        const surfaceArea = unitType === 'apartment' ? 50 + Math.random() * 100 : 
                           unitType === 'commercial' ? 30 + Math.random() * 200 :
                           unitType === 'garage' ? 15 + Math.random() * 10 :
                           10 + Math.random() * 15; // storage
        
        // Millieme is proportional to surface area
        const millieme = Math.round((surfaceArea / 80) * 1000 / unitsPerBuilding);
        
        try {
          const unit = await db.queryRow`
            INSERT INTO units (
              building_id, unit_number, floor, unit_type, surface_area,
              millieme, description, balcony_area, garage_included, storage_included
            ) VALUES (
              ${building.id}, ${unitNumber}, ${floor}, ${unitType}, ${Math.round(surfaceArea * 100) / 100},
              ${millieme}, ${`${unitType} unit on floor ${floor}`}, 
              ${unitType === 'apartment' ? Math.round(Math.random() * 20) : null},
              ${unitType === 'apartment' && Math.random() > 0.7},
              ${unitType === 'apartment' && Math.random() > 0.6}
            )
            RETURNING id
          `;

          if (unit) {
            unitsCreated++;

            // Assign owners to this unit
            const numOwners = Math.random() > 0.8 ? 2 : 1; // 20% chance of co-ownership
            const selectedOwners = owners.sort(() => 0.5 - Math.random()).slice(0, numOwners);
            
            for (let ownerIndex = 0; ownerIndex < selectedOwners.length; ownerIndex++) {
              const owner = selectedOwners[ownerIndex];
              const ownershipPercentage = numOwners === 1 ? 100 : (ownerIndex === 0 ? 60 : 40);
              
              await db.queryRow`
                INSERT INTO ownerships (
                  unit_id, owner_id, ownership_percentage, start_date,
                  purchase_price, is_primary_residence, is_rental_property
                ) VALUES (
                  ${unit.id}, ${owner.id}, ${ownershipPercentage}, 
                  ${new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)},
                  ${Math.round((surfaceArea * (2000 + Math.random() * 3000)) / 100) * 100},
                  ${Math.random() > 0.3}, ${Math.random() > 0.7}
                )
              `;
              ownershipsCreated++;
            }
          }
        } catch (error) {
          console.error(`Error creating unit ${unitNumber} in building ${building.name}:`, error);
        }
      }
    }

    return {
      message: `Successfully seeded ${unitsCreated} units with ${ownershipsCreated} ownerships`,
      unitsCreated,
      ownershipsCreated,
    };
  }
);