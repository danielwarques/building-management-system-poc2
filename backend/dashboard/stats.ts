import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  completedIssues: number;
  totalCost: number;
  recentIssues: RecentIssue[];
  upcomingExpirations: UpcomingExpiration[];
}

interface RecentIssue {
  id: number;
  title: string;
  status: string;
  priority: string;
  buildingName: string;
  createdAt: string;
}

interface UpcomingExpiration {
  id: number;
  name: string;
  category: string;
  expiryDate: string;
  buildingName: string;
}

// Retrieves dashboard statistics.
export const getStats = api<void, DashboardStats>(
  { expose: true, method: "GET", path: "/dashboard/stats", auth: true },
  async () => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    
    // Build WHERE clause based on user type
    let buildingFilter = "";
    let buildingParams: any[] = [];
    
    if (auth.userType === 'building_owner') {
      // Building owners can only see data for buildings they own units in
      buildingFilter = `
        AND b.id IN (
          SELECT DISTINCT u.building_id 
          FROM units u 
          JOIN ownerships o ON u.id = o.unit_id 
          WHERE o.owner_id = $1 AND o.active = true
        )`;
      buildingParams = [userId];
    } else if (auth.userType === 'syndic') {
      // Syndics can only see data for buildings they manage
      buildingFilter = ` AND b.syndic_id = $1`;
      buildingParams = [userId];
    }
    // Administrators can see all data (no filter)
    // Get issue statistics
    const issueStatsQuery = `
      SELECT 
         COUNT(*) as total_issues,
         COUNT(CASE WHEN i.status = 'open' THEN 1 END) as open_issues,
         COUNT(CASE WHEN i.status IN ('assigned', 'in_progress') THEN 1 END) as in_progress_issues,
         COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_issues,
         COALESCE(SUM(i.actual_cost), 0) as total_cost
       FROM issues i
       INNER JOIN buildings b ON i.building_id = b.id
       WHERE 1=1 ${buildingFilter}`;
       
    const issueStats = await db.rawQueryRow(issueStatsQuery, ...buildingParams);

    // Get recent issues
    const recentIssuesQuery = `
      SELECT i.id, i.title, i.status, i.priority, b.name as building_name, i.created_at
      FROM issues i
      INNER JOIN buildings b ON i.building_id = b.id
      WHERE 1=1 ${buildingFilter}
      ORDER BY i.created_at DESC
      LIMIT 5`;
      
    const recentIssues = await db.rawQueryAll(recentIssuesQuery, ...buildingParams);

    // Get upcoming document expirations
    const upcomingExpirationsQuery = `
      SELECT d.id, d.name, d.category, d.expiry_date, b.name as building_name
      FROM documents d
      INNER JOIN buildings b ON d.building_id = b.id
      WHERE d.expiry_date IS NOT NULL 
        AND d.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND d.expiry_date >= CURRENT_DATE
        ${buildingFilter}
      ORDER BY d.expiry_date ASC
      LIMIT 10`;
      
    const upcomingExpirations = await db.rawQueryAll(upcomingExpirationsQuery, ...buildingParams);

    return {
      totalIssues: parseInt(issueStats?.total_issues || "0"),
      openIssues: parseInt(issueStats?.open_issues || "0"),
      inProgressIssues: parseInt(issueStats?.in_progress_issues || "0"),
      completedIssues: parseInt(issueStats?.completed_issues || "0"),
      totalCost: parseFloat(issueStats?.total_cost || "0"),
      recentIssues: recentIssues.map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        status: issue.status,
        priority: issue.priority,
        buildingName: issue.building_name,
        createdAt: issue.created_at,
      })),
      upcomingExpirations: upcomingExpirations.map((exp: any) => ({
        id: exp.id,
        name: exp.name,
        category: exp.category,
        expiryDate: exp.expiry_date,
        buildingName: exp.building_name,
      })),
    };
  }
);
