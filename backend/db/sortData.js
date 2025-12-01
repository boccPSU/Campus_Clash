// All querys to sort data or filter data in DB 
import { pool } from "./db.js";

// Groups all majors in studetnts table based on highest XP to least XP
export async function getSortedMajors() {
  const [rows] = await pool.query(`
    SELECT
    COALESCE(NULLIF(TRIM(s.major), ''), 'Unknown') AS major,
    SUM(COALESCE(s.xp, 0))      AS totalXp  
    FROM students s
    GROUP BY COALESCE(NULLIF(TRIM(s.major), ''), 'Unknown')
    ORDER BY totalXp DESC, major ASC;
  `);
  return rows;
}

// Groups all students and returns them sorted by highest XP to lowest XP
// Includes username, major, university, and total XP.
export async function getSortedStudents() {
  const [rows] = await pool.query(`
    SELECT 
      u.username,
      COALESCE(s.XP, 0) AS totalXp,
      COALESCE(NULLIF(TRIM(s.major), ''), 'Unknown') AS major,
      COALESCE(NULLIF(TRIM(s.university), ''), 'Unknown') AS university
    FROM students s
    INNER JOIN users u ON u.pid = s.pid
    ORDER BY totalXp DESC, u.username ASC;
  `);

  return rows;
}

