import { api } from "encore.dev/api";
import * as bcrypt from "bcryptjs";
import db from "../db";

interface SeedSuppliersResponse {
  message: string;
  created: boolean;
}

export const seedSuppliers = api<{}, SeedSuppliersResponse>(
  { expose: true, method: "POST", path: "/suppliers/seed" },
  async () => {
    try {
      const existingSuppliersResult = await db.query`
        SELECT COUNT(*) as count FROM suppliers
      `;
      const existingSuppliers = [];
      for await (const row of existingSuppliersResult) {
        existingSuppliers.push(row);
      }

      if (existingSuppliers[0]?.count > 0) {
        return {
          message: "Suppliers already exist",
          created: false
        };
      }

      const hashedPassword = await bcrypt.hash("password", 12);

      const suppliers = [
        {
          email: "john.martinez@hvacprosolutions.com",
          firstName: "John",
          lastName: "Martinez",
          phone: "+1-555-0101",
          companyName: "HVAC Pro Solutions LLC",
          specialties: ["HVAC", "Electrical", "Energy Efficiency"],
          rating: 4.8,
          totalJobs: 187
        },
        {
          email: "sarah.johnson@quickfixplumbing.com",
          firstName: "Sarah",
          lastName: "Johnson",
          phone: "+1-555-0102",
          companyName: "QuickFix Plumbing & Water Systems",
          specialties: ["Plumbing", "Water Systems", "Leak Detection"],
          rating: 4.6,
          totalJobs: 234
        },
        {
          email: "michael.chen@securehomesystems.com",
          firstName: "Michael",
          lastName: "Chen",
          phone: "+1-555-0103",
          companyName: "SecureHome Systems Inc.",
          specialties: ["Security", "Access Control", "CCTV"],
          rating: 4.9,
          totalJobs: 142
        },
        {
          email: "lisa.rodriguez@elevatortech.com",
          firstName: "Lisa",
          lastName: "Rodriguez",
          phone: "+1-555-0104",
          companyName: "Elevator Tech Specialists",
          specialties: ["Elevator", "Mechanical", "Safety Systems"],
          rating: 4.7,
          totalJobs: 89
        },
        {
          email: "david.thompson@roofmasterservices.com",
          firstName: "David",
          lastName: "Thompson",
          phone: "+1-555-0105",
          companyName: "RoofMaster Services & Waterproofing",
          specialties: ["Roof", "Waterproofing", "Structural"],
          rating: 4.5,
          totalJobs: 156
        },
        {
          email: "anna.wilson@windowworksplus.com",
          firstName: "Anna",
          lastName: "Wilson",
          phone: "+1-555-0106",
          companyName: "Window Works Plus",
          specialties: ["Windows", "Doors", "Glass Repair"],
          rating: 4.4,
          totalJobs: 123
        },
        {
          email: "carlos.garcia@multiservicemaintenance.com",
          firstName: "Carlos",
          lastName: "Garcia",
          phone: "+1-555-0107",
          companyName: "MultiService Maintenance Corp",
          specialties: ["General Maintenance", "Plumbing", "Electrical", "Painting"],
          rating: 4.3,
          totalJobs: 312
        },
        {
          email: "emma.brown@greentechsolutions.com",
          firstName: "Emma",
          lastName: "Brown",
          phone: "+1-555-0108",
          companyName: "GreenTech Solutions & Solar",
          specialties: ["Energy Systems", "HVAC", "Solar", "Smart Home"],
          rating: 4.8,
          totalJobs: 98
        },
        {
          email: "robert.kim@urbanfacilities.com",
          firstName: "Robert",
          lastName: "Kim",
          phone: "+1-555-0109",
          companyName: "Urban Facilities Management",
          specialties: ["Facility Management", "HVAC", "Electrical", "Emergency Services"],
          rating: 4.6,
          totalJobs: 203
        },
        {
          email: "maria.santos@reliablecleanpro.com",
          firstName: "Maria",
          lastName: "Santos",
          phone: "+1-555-0110",
          companyName: "Reliable CleanPro Services",
          specialties: ["Cleaning", "Janitorial", "Carpet Care", "Window Cleaning"],
          rating: 4.7,
          totalJobs: 267
        },
        {
          email: "james.patel@smartsecuritysys.com",
          firstName: "James",
          lastName: "Patel",
          phone: "+1-555-0111",
          companyName: "Smart Security Systems Ltd",
          specialties: ["Security", "Fire Safety", "Emergency Systems", "Monitoring"],
          rating: 4.9,
          totalJobs: 134
        },
        {
          email: "jennifer.o'connor@landscapepros.com",
          firstName: "Jennifer",
          lastName: "O'Connor",
          phone: "+1-555-0112",
          companyName: "Landscape Pros & Grounds Keeping",
          specialties: ["Landscaping", "Grounds Maintenance", "Irrigation", "Snow Removal"],
          rating: 4.2,
          totalJobs: 189
        },
        {
          email: "alexander.volkov@techrepairexperts.com",
          firstName: "Alexander",
          lastName: "Volkov",
          phone: "+1-555-0113",
          companyName: "Tech Repair Experts",
          specialties: ["Electronics", "Appliance Repair", "Smart Systems", "Automation"],
          rating: 4.5,
          totalJobs: 145
        },
        {
          email: "michelle.taylor@paintprofessionals.com",
          firstName: "Michelle",
          lastName: "Taylor",
          phone: "+1-555-0114",
          companyName: "Paint Professionals & Decorating",
          specialties: ["Painting", "Decorating", "Drywall", "Flooring"],
          rating: 4.4,
          totalJobs: 178
        },
        {
          email: "daniel.andersson@nordicmaintenance.com",
          firstName: "Daniel",
          lastName: "Andersson",
          phone: "+1-555-0115",
          companyName: "Nordic Maintenance Solutions",
          specialties: ["Snow Removal", "Ice Management", "Seasonal Maintenance", "Emergency Response"],
          rating: 4.6,
          totalJobs: 92
        }
      ];

      for (const supplier of suppliers) {
        // Create user account for supplier
        const userResult = await db.queryRow`
          INSERT INTO users (email, password_hash, first_name, last_name, role, phone, active)
          VALUES (${supplier.email}, ${hashedPassword}, ${supplier.firstName}, ${supplier.lastName}, 'supplier', ${supplier.phone}, true)
          RETURNING id
        `;

        if (userResult) {
          // Create supplier profile
          await db.query`
            INSERT INTO suppliers (user_id, company_name, specialties, rating, total_jobs)
            VALUES (${userResult.id}, ${supplier.companyName}, ${supplier.specialties}, ${supplier.rating}, ${supplier.totalJobs})
          `;
        }
      }

      return {
        message: `${suppliers.length} suppliers created successfully`,
        created: true
      };
    } catch (error) {
      console.error("Error seeding suppliers:", error);
      throw error;
    }
  }
);