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
