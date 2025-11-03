// All querys to sort data or filter data in DB go here

//Imports
import { pool } from "./db.js";

export async function getSortedMajors() {
  const [rows] = await pool.query(`
    SELECT
    COALESCE(NULLIF(TRIM(u.major), ''), 'Unknown') AS major,
    SUM(COALESCE(u.xp, 0))      AS totalXp  
    FROM users u
    GROUP BY COALESCE(NULLIF(TRIM(u.major), ''), 'Unknown')
    ORDER BY totalXp DESC, major ASC;
  `);
  return rows;
}
