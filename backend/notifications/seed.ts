import { api } from "encore.dev/api";
import db from "../db";

interface SeedNotificationsResponse {
  message: string;
  created: boolean;
}

export const seedNotifications = api<{}, SeedNotificationsResponse>(
  { expose: true, method: "POST", path: "/notifications/seed" },
  async () => {
    try {
      const existingNotificationsResult = await db.query`
        SELECT COUNT(*) as count FROM notifications
      `;
      const existingNotifications = [];
      for await (const row of existingNotificationsResult) {
        existingNotifications.push(row);
      }

      if (existingNotifications[0]?.count > 0) {
        return {
          message: "Notifications already exist",
          created: false
        };
      }

      // Get admin user and all issues for reference
      const adminUser = await db.queryRow`SELECT id FROM users WHERE email = 'admin@demo.com'`;
      
      const issuesResult = await db.query`SELECT id, title, status FROM issues`;
      const issues = [];
      for await (const row of issuesResult) {
        issues.push(row);
      }
      
      const buildingsResult = await db.query`SELECT id, name FROM buildings`;
      const buildings = [];
      for await (const row of buildingsResult) {
        buildings.push(row);
      }

      if (!adminUser) {
        throw new Error("Admin user not found. Please run auth seed first.");
      }

      const notificationTypes = ["issue_created", "issue_updated", "issue_completed", "maintenance_reminder", "system_alert"];
      
      const notificationTemplates = [
        {
          title: "Critical HVAC System Issue Reported",
          message: "A critical heating system malfunction has been reported at Metropolitan Heights affecting floors 5-8. Immediate contractor response required.",
          type: "issue_created"
        },
        {
          title: "Water Leak Emergency - Status Update",
          message: "Emergency water leak repair at Harbor View Residences is now in progress. Plumbing contractor on-site. Estimated completion: 4 hours.",
          type: "issue_updated"
        },
        {
          title: "Elevator Modernization Project Completed",
          message: "The elevator modernization project at The Meridian Tower has been completed successfully. All safety certifications obtained.",
          type: "issue_completed"
        },
        {
          title: "Annual Fire Safety Inspection Scheduled",
          message: "Annual fire safety inspection for Sunset Garden Apartments is scheduled for March 15th at 9:00 AM. Please ensure all fire doors and exits are accessible.",
          type: "maintenance_reminder"
        },
        {
          title: "Building-Wide Fire Alarm System Test",
          message: "Comprehensive fire alarm system test scheduled for Cedar Creek Commons tomorrow at 10:30 AM. Residents have been notified of temporary alarm activation.",
          type: "system_alert"
        },
        {
          title: "Weekend Elevator Maintenance - Riverside Lofts",
          message: "Scheduled elevator maintenance at Riverside Lofts this Saturday 8:00 AM - 4:00 PM. Service elevator available for emergencies.",
          type: "maintenance_reminder"
        },
        {
          title: "Planned Water Service Interruption",
          message: "Water main maintenance at Park Plaza Condominiums will cause service interruption Thursday 9:00 AM - 2:00 PM. Advance notice sent to all residents.",
          type: "system_alert"
        },
        {
          title: "Urgent Security System Issue Escalated",
          message: "High priority security camera malfunction at Heritage Square Apartments has been escalated to Smart Security Systems Ltd for immediate response.",
          type: "issue_updated"
        },
        {
          title: "Q1 Building Inspection Due - Multiple Properties",
          message: "First quarter building inspections are due for 3 properties next month. Schedule certified inspectors for compliance requirements.",
          type: "maintenance_reminder"
        },
        {
          title: "Emergency Generator Repair Completed",
          message: "Emergency generator maintenance at Metropolitan Heights completed successfully. System passed all load tests and is fully operational.",
          type: "issue_completed"
        },
        {
          title: "New Contractor Application - Nordic Maintenance",
          message: "Nordic Maintenance Solutions has submitted a contractor application specializing in snow removal and seasonal maintenance. Background verification in progress.",
          type: "system_alert"
        },
        {
          title: "Monthly Budget Review - March Expenses",
          message: "March maintenance budget review required. Total expenses: $47,230. Several large repairs require board approval before proceeding.",
          type: "system_alert"
        },
        {
          title: "HVAC Performance Alert - Energy Efficiency",
          message: "HVAC system at The Meridian Tower showing 15% decrease in energy efficiency. Preventive maintenance recommended to avoid system failure.",
          type: "maintenance_reminder"
        },
        {
          title: "Security System Software Update Complete",
          message: "Security system upgrade completed at Harbor View Residences. New features include mobile app integration and enhanced night vision capabilities.",
          type: "system_alert"
        },
        {
          title: "Equipment Warranty Expiration Alert",
          message: "Elevator system warranty at Sunset Garden Apartments expires April 30th. Renewal quotes requested from 3 certified service providers.",
          type: "maintenance_reminder"
        },
        {
          title: "Roof Inspection Report Available",
          message: "Post-storm roof inspection report for Cedar Creek Commons shows minor damage to 4 membrane sections. Repair estimates attached.",
          type: "issue_created"
        },
        {
          title: "Plumbing Emergency Response - Status Update",
          message: "Water pressure issue at Riverside Lofts has been resolved. New pump installation completed. System performance restored to normal levels.",
          type: "issue_updated"
        },
        {
          title: "Annual HVAC Maintenance Completed",
          message: "Comprehensive HVAC system maintenance at Park Plaza Condominiums completed. Filter replacements, duct cleaning, and efficiency optimization performed.",
          type: "issue_completed"
        },
        {
          title: "Seasonal Maintenance Preparation Required",
          message: "Winter preparation checklist for Heritage Square Apartments includes heating system inspection, pipe insulation check, and snow removal equipment setup.",
          type: "maintenance_reminder"
        },
        {
          title: "Power Outage Emergency Response",
          message: "Scheduled electrical panel upgrade at Metropolitan Heights will require 4-hour power outage Sunday 6:00 AM - 10:00 AM. Generator backup arranged.",
          type: "system_alert"
        },
        {
          title: "Window Replacement Project Approved",
          message: "Board has approved window replacement project for Harbor View Residences south facade. Work scheduled for May-June timeframe.",
          type: "issue_updated"
        },
        {
          title: "Landscaping Maintenance Completed",
          message: "Spring landscaping and grounds maintenance at The Meridian Tower completed. Irrigation system tested and seasonal plantings installed.",
          type: "issue_completed"
        },
        {
          title: "Energy Efficiency Audit Scheduled",
          message: "Professional energy efficiency audit scheduled for Sunset Garden Apartments next Tuesday. Building access required 9:00 AM - 5:00 PM.",
          type: "maintenance_reminder"
        },
        {
          title: "Building Access System Upgrade",
          message: "Access control system at Cedar Creek Commons updated with new keycard encryption. All resident cards remain valid with enhanced security features.",
          type: "system_alert"
        },
        {
          title: "Contractor Performance Review Due",
          message: "Quarterly contractor performance review due for 8 active service providers. Rating updates and contract renewals require attention.",
          type: "system_alert"
        },
        {
          title: "Emergency Lighting Test Results",
          message: "Monthly emergency lighting test at Riverside Lofts identified 3 fixtures requiring battery replacement. Maintenance scheduled for this week.",
          type: "maintenance_reminder"
        }
      ];

      const createdNotifications = [];

      for (let i = 0; i < notificationTemplates.length; i++) {
        const template = notificationTemplates[i];
        
        // Randomly select reference ID based on type
        let referenceId = null;
        if (template.type.includes("issue") && issues.length > 0) {
          referenceId = issues[Math.floor(Math.random() * issues.length)].id;
        } else if (buildings.length > 0) {
          referenceId = buildings[Math.floor(Math.random() * buildings.length)].id;
        }

        // Randomly determine if notification is read
        const isRead = Math.random() > 0.4; // 60% chance of being read
        
        // Create notification with random timestamp in the last 30 days
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

        const result = await db.queryRow`
          INSERT INTO notifications (user_id, title, message, type, reference_id, read, created_at)
          VALUES (${adminUser.id}, ${template.title}, ${template.message}, ${template.type}, ${referenceId}, ${isRead}, ${createdDate.toISOString()})
          RETURNING id
        `;

        if (result) {
          createdNotifications.push(result.id);
        }
      }

      return {
        message: `${createdNotifications.length} notifications created successfully`,
        created: true
      };
    } catch (error) {
      console.error("Error seeding notifications:", error);
      throw error;
    }
  }
);