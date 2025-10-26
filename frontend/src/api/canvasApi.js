/**
 * uniqueBy(arr, keyFn)
 * Deduplicate an array using a key function. Preserves the first occurrence.
 * Used to keep only one enrollment row per course_id.
 */
function uniqueBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/**
 * cleanCourseTitle(raw)
 * Clean up verbose Canvas course titles while KEEPING the subject prefix
 * (e.g., "CMPSC 221").
 */
function cleanCourseTitle(raw) {
  if (!raw) return raw;
  let s = String(raw);

  // 1) Drop trailing parenthetical junk e.g. "(22481--ER---P-...-001-)"
  s = s.replace(/\s*\([^)]*\)\s*$/, "");

  // 2) Remove section labels like ", Section 001:" or ", Section 002"
  s = s.replace(/,\s*Section\s*\d{1,3}\s*:?/gi, "");

  // 3) Capture a subject prefix (dept + number) and keep readable rest
  const prefixMatch = s.match(/^([A-Z]{2,}\s*\d{2,3}[A-Z]?)\s*(.*)$/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1].trim();
    let rest = prefixMatch[2].trim();

    // If multiple colons, keep only the part after the last colon
    if (rest.includes(":")) {
      rest = rest.split(":").pop().trim();
    }

    s = rest ? `${prefix} ${rest}` : prefix;
  } else {
    // No obvious prefix → still collapse any colon noise
    if (s.includes(":")) {
      s = s.split(":").pop().trim();
    }
  }

  // 4) Normalize spaces
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

/**
 * pickDisplayName(course, fallbackId)
 * Choose the best human-readable name from the course object.
 * Fallback: "Course {id}".
 */
function pickDisplayName(course, fallbackId) {
  const raw =
    course?.name ??
    course?.course_code ??
    course?.short_name ??
    course?.sis_course_id ??
    null;

  const cleaned = cleanCourseTitle(raw);
  return cleaned || `Course ${fallbackId}`;
}

// Helper function to 

/* Calls Express server at /api/*
   Uses /users/self/enrollments and fills missing names via /courses/:id.
*/
export function createCanvasProxyClient({ basePath = "/api" } = {}) {
  function baseCardsFromEnrollments(enrollments) {
    const uniq = uniqueBy(
      enrollments.filter((e) => e && typeof e.course_id !== "undefined"),
      (e) => e.course_id
    );

    
    return uniq.map((e) => {
      const course = e.course || {};
      const name = pickDisplayName(course, e.course_id);
      const g = e.grades || {};
      const percent = g.current_score ?? g.final_score ?? null;
      const letter = g.current_grade ?? g.final_grade ?? null;

      return {
        id: e.course_id,
        name, // already cleaned
        percent: typeof percent === "number" ? percent : null,
        grade: letter ?? null,
      };
    });
  }

  async function fetchCourseName(id) {
    const res = await fetch(`${basePath}/v1/courses/${id}`);
    if (!res.ok) return null;
    const c = await res.json();
    return pickDisplayName(c, id);
  }
  
  return {
    /**
     * Fetch the signed-in user's active student enrollments (with grades + course).
     * Returns an array of { id, name, percent, grade }.
     */
    async getCoursesWithGrades() {
      const params = new URLSearchParams();
      params.append("type[]", "StudentEnrollment");
      params.append("state[]", "active");
      params.append("include[]", "course");
      params.set("per_page", "50");

      const res = await fetch(
        `${basePath}/v1/users/self/enrollments?${params.toString()}`
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText}\n${text}`);
      }
      const enrollments = await res.json();

      // Initial shaping
      const cards = baseCardsFromEnrollments(enrollments);

      // Repair any missing names by calling /courses/:id
      const missing = cards.filter(
        (c) => !c.name || /^Course \d+$/i.test(c.name)
      );
      if (missing.length > 0) {
        const fetched = await Promise.all(
          missing.map(async (m) => {
            try {
              const name = await fetchCourseName(m.id);
              return { id: m.id, name };
            } catch {
              return { id: m.id, name: null };
            }
          })
        );
        const byId = new Map(fetched.map((f) => [f.id, f.name]));
        for (const c of cards) {
          if (!c.name || /^Course \d+$/i.test(c.name)) {
            const fixed = byId.get(c.id);
            c.name = fixed || `Course ${c.id}`;
          }
        }
      }

      return cards;
    },

    
  };
}

