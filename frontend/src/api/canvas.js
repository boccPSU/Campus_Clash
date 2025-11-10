// Hardcoded semester start (edit this date as needed)
const SEMESTER_START = new Date("2025-01-10T00:00:00Z"); // Fall 2025

//Frontend helper function to talk to backend proxy
const BACKEND_BASE = "http://localhost:5000";

//Helper function to build query strings, for example ?enrollment_state=active
//input is object like { a: 1, b: "x" } -> "?a=1&b=x"

function toQuery(params) {
    //if no params are passed return empty string
    if (!params) {
        return "";
    }

    //browser API that safely encodes search pearams allows key value pairs to be stored as key=value
    const usp = new URLSearchParams();

    // Goinng through every parameter and adding the parameter name and value to the usp string
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) usp.append(k, String(v));
    }

    const qs = usp.toString();

    //if qs exists, return querry string, else return empty string
    return qs ? `?${qs}` : "";
}

// Basic GET function through backend
export async function canvasGet(path, params) {
    //Make sure path starts with /
    const safePath = path.startsWith("/") ? path : `/${path}`;

    // Backend exposes all /api paths so add /api as well as backend base
    const url = `${BACKEND_BASE}/api${safePath}${toQuery(params)}`;
    console.log("[canvasGet] GET", url);
    // Fetch result from backend
    const res = await fetch(url, {
        method: "GET",
        credentials: "omit", // don't send browser cookies
    });

    // Catch and log errors
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend ${res.status}: ${text.slice(0, 300)}...`);
    }

    // Return result as JSON
    return res.json();
}

// ------------------------------------------------------------
// Helper: parse an ISO date safely.
// Returns a Date or null if input is missing/invalid.
// ------------------------------------------------------------
function parseIsoDate(iso) {
  // Guard against undefined/null/empty strings.
  if (!iso) return null;
  const t = Date.parse(iso); // Date.parse returns ms timestamp or NaN.
  return Number.isFinite(t) ? new Date(t) : null; // Convert to Date if valid.
}

// ------------------------------------------------------------
// Helper: does this enrollment have any grade info?
// We accept either a numeric score or a letter grade as "has a grade".
// ------------------------------------------------------------
function hasAnyGrade(enrollment) {
  // Canvas enrollments often carry both "current_*" and "final_*".
  const g = enrollment?.grades || {};
  const percent = g.current_score ?? g.final_score; // Prefer current_score, fallback to final_score.
  const letter = g.current_grade ?? g.final_grade;  // Prefer current_grade, fallback to final_grade.

  if(letter == null && percent == 0){
    return false;
  }
  //if(letter == null) return false;
  // If either is present, we treat it as graded.
  const hasPercent = typeof percent === "number" && Number.isFinite(percent);
  const hasLetter = letter != null && String(letter).trim().length > 0;
  return hasPercent || hasLetter;
}

// ------------------------------------------------------------
// Helper: choose a readable name with simple fallback.
// (Deliberately simple—no heavy cleanup to keep this file minimal.)
// ------------------------------------------------------------

function pickSimpleCourseName(course, fallbackId) {
  // Try common Canvas name fields in order.
  const raw =
    course?.name ??
    course?.course_code ??
    course?.short_name ??
    course?.sis_course_id ??
    null;

  // If nothing usable, fallback to "Course {id}".
  const s = raw != null ? String(raw).trim() : "";
  return s.length > 0 ? s : `Course ${fallbackId}`;
}

// Fetch a single course by id when include[]=course is missing.
async function fetchCourseById(courseId) {
  try {
    const c = await canvasGet(`/v1/courses/${courseId}`);
    return c ?? null;
  } catch {
    return null;
  }
}

export async function getMySemesterCoursesWithGrades() {
  const params = {
    "type[]": "StudentEnrollment",
    "state[]": "active",
    "include[]": "course",
    per_page: 100,
  };

  const enrollments = await canvasGet("/v1/users/self/enrollments", params);
  const total = Array.isArray(enrollments) ? enrollments.length : 0;

  const seenCourseIds = new Set();
  const metrics = {
    total,
    accepted: 0,
    duplicateCourse: 0,
    noCourseId: 0,
    noCourseObj: 0,
    tooOld: 0,
    noGrade: 0,
  };

  const cards = [];

  for (const e of Array.isArray(enrollments) ? enrollments : []) {
    const courseId = e?.course_id;
    if (typeof courseId !== "number") {
      metrics.noCourseId++;
      console.log(`[courses] reject: noCourseId`);
      continue;
    }

    if (seenCourseIds.has(courseId)) {
      metrics.duplicateCourse++;
      console.log(`[courses] reject: duplicate course_id=${courseId}`);
      continue;
    }

    // Ensure we have a course object; if missing, fetch it.
    let course = e?.course ?? null;
    if (!course) {
      course = await fetchCourseById(courseId);
    }
    if (!course) {
      metrics.noCourseObj++;
      console.log(`[courses] reject: course_id=${courseId} reason=noCourseObj`);
      continue;
    }

    // Created-at filter.
    const created = parseIsoDate(course.created_at);
    if (!created || created < SEMESTER_START) {
      metrics.tooOld++;
      const ca = course.created_at ?? "null";
      console.log(
        `[courses] reject: course_id=${courseId} name="${pickSimpleCourseName(course, courseId)}" created_at=${ca} reason=tooOld`
      );
      continue;
    }

    // Grade filter.
    if (!hasAnyGrade(e)) {
      metrics.noGrade++;
      console.log(
        `[courses] reject: course_id=${courseId} name="${pickSimpleCourseName(course, courseId)}" reason=noGrade`
      );
      continue;
    }

    // Passed all filters → accept.
    seenCourseIds.add(courseId);
    metrics.accepted++;

    const g = e.grades || {};
    const rawPercent = g.current_score ?? g.final_score ?? null;
    const percent =
      typeof rawPercent === "number" && Number.isFinite(rawPercent)
        ? rawPercent
        : null;
    const letter = g.current_grade ?? g.final_grade ?? null;
    const name = pickSimpleCourseName(course, courseId);

    cards.push({
      id: courseId,
      name,
      percent,
      grade: letter ?? null,
      created_at: course.created_at,
    });

    console.log(
      `[courses] accept: course_id=${courseId} name="${name}" created_at=${course.created_at} percent=${percent ?? "null"} grade=${letter ?? "null"}`
    );
  }

  console.log(
    `[courses] summary: total=${metrics.total} accepted=${metrics.accepted} dup=${metrics.duplicateCourse} noCourseId=${metrics.noCourseId} noCourseObj=${metrics.noCourseObj} tooOld=${metrics.tooOld} noGrade=${metrics.noGrade}`
  );

  return cards;
}
// Format a due date for display (local timezone).
function formatDueLocal(iso) {
  if (!iso) return "No due date";
  const d = new Date(iso);
  // Example: Thu, Oct 30, 2025, 11:59 PM
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Reuse the classifier you already added earlier:
function classifyAssignmentType(a) {
  if (a?.is_quiz_assignment || a?.quiz_id != null) return "Quiz";
  if (Array.isArray(a?.submission_types) && a.submission_types.includes("discussion_topic")) {
    return "Discussion";
  }
  return "Assignment";
}

// Fetch assignments for one course and client-filter by due date range.
async function fetchAssignmentsForCourse(courseId, { dueAfter, dueBefore } = {}) {
  const params = {
    per_page: 100,
    order_by: "due_at",
    "include[]": "submission",
  };
  const list = await canvasGet(`/v1/courses/${courseId}/assignments`, params);
  return Array.isArray(list) ? list.filter((a) => {
    const due = parseIsoDate(a?.due_at);
    if (!due) return false;                 // only items with a real due date
    if (dueAfter && due < dueAfter) return false;
    if (dueBefore && due > dueBefore) return false;
    if (a?.published === false) return false;
    return true;
  }) : [];
}

/**
 * Get upcoming assignment alerts (UI-ready).
 * - Only for courses returned by getMySemesterCoursesWithGrades().
 * - Returns array of { id, courseId, courseName, title, type, dueAtISO, dueLabel }.
 * - Configure via daysAhead (default 14) and startAt (default now).
 */
export async function getUpcomingAssignmentAlerts({ daysAhead = 14, startAt = new Date() } = {}) {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + daysAhead * 86400000);

  // Selected courses (active, created after SEMESTER_START, with non-null letter grade).
  const selected = await getMySemesterCoursesWithGrades();

  const alerts = [];
  for (const c of selected) {
    const items = await fetchAssignmentsForCourse(c.id, { dueAfter: start, dueBefore: end });
    for (const a of items) {
      const type = classifyAssignmentType(a);
      const dueAtISO = a?.due_at ?? null;
      alerts.push({
        id: `${c.id}:${a.id}`,               // stable key for React
        courseId: c.id,
        courseName: c.name ?? `Course ${c.id}`,
        title: a?.name ?? "(untitled)",
        type,
        dueAtISO,
        dueLabel: formatDueLocal(dueAtISO),
      });
    }
  }

  // Sort ascending by due date so soonest appears first.
  alerts.sort((x, y) => (new Date(x.dueAtISO)) - (new Date(y.dueAtISO)));

  return alerts;
}

/**
 * Log upcoming assignment alerts for the user's selected courses.
 * - Selected courses = those returned by getMySemesterCoursesWithGrades().
 * - Configurable window: daysAhead (default 14). You can also pass a custom "startAt".
 * - Logs: assignment name, assignment type, due date (ISO).
 */
export async function logUpcomingAssignmentsForSelectedCourses({ daysAhead = 14, startAt = new Date() } = {}) {
  const start = new Date(startAt);                      // window start (usually now)
  const end = new Date(start.getTime() + daysAhead * 86400000); // window end

  // Get filtered courses (active, created after SEMESTER_START, with non-null letter grade).
  const selected = await getMySemesterCoursesWithGrades();
  const courseIds = selected.map((c) => c.id);

  console.log(`[assignments] window start=${start.toISOString()} end=${end.toISOString()} daysAhead=${daysAhead}`);
  console.log(`[assignments] course_ids=${courseIds.join(", ") || "(none)"}`);

  let total = 0;

  for (const c of selected) {
    const courseId = c.id;
    // Fetch and client-filter assignments for this course.
    const items = await fetchAssignmentsForCourse(courseId, { dueAfter: start, dueBefore: end });

    // Log each assignment: name, type, due date.
    for (const a of items) {
      const t = classifyAssignmentType(a);
      const dueIso = a?.due_at ?? "null";
      const name = a?.name ?? "(untitled)";
      console.log(`[assignments] course_id=${courseId} name="${name}" type=${t} due=${dueIso}`);
      total++;
    }
  }

  console.log(`[assignments] summary: courses=${courseIds.length} assignments_logged=${total}`);
}


// ------------------------------------------------------------
// Recent submissions checker (server-side filtering version)
// ------------------------------------------------------------

// checks for recent submissions within the past seven days
export async function checkRecentSubmissions({ lookbackMinutes = 60 * 24 * 7, now = new Date() } = {}) {
  const since = new Date(now.getTime() - lookbackMinutes * 60_000);

  // reuse course filter
  const selectedCourses = await getMySemesterCoursesWithGrades();

  const results = [];

  for (const c of selectedCourses) {
    const courseId = c.id;

    const params = {
      per_page: 100,
      "student_ids[]": "self",
      "include[]": "assignment",
      submitted_since: since.toISOString(),
    };

    let subs;
    try {
      subs = await canvasGet(`/v1/courses/${courseId}/students/submissions`, params);
    } catch (e) {
      console.warn(`[recent] skip course_id=${courseId} name="${c.name}" reason=fetch_error: ${String(e)}`);
      continue;
    }

    if (!Array.isArray(subs) || subs.length === 0) continue;

    for (const s of subs) {
      const submittedAt = s?.submitted_at ?? null;
      const a = s?.assignment || {};
      const assignmentId = a?.id ?? s?.assignment_id ?? null;
      const assignmentName = (a?.name ?? "(untitled)").trim();
      const dueAtISO = a?.due_at ?? null;

      // determine on-time vs late
      let onTime = null;
      if (typeof s?.late === "boolean") {
        onTime = !s.late;
      } else if (dueAtISO && submittedAt) {
        const dueT = Date.parse(dueAtISO);
        const subT = Date.parse(submittedAt);
        if (Number.isFinite(dueT) && Number.isFinite(subT)) {
          onTime = subT <= dueT;
        }
      }

      console.log(
        `[recent] submitted: course_id=${courseId} course="${c.name}" assignment_id=${assignmentId} assignment="${assignmentName}" submitted_at=${submittedAt}`
      );

      if (onTime === true) {
        console.log(`[recent] status: on-time (due=${dueAtISO ?? "none"})`);
      } else if (onTime === false) {
        console.log(`[recent] status: LATE (due=${dueAtISO ?? "none"})`);
      } else {
        console.log(`[recent] status: no-due-date-or-unknown (due=${dueAtISO ?? "none"})`);
      }

      results.push({
        courseId,
        courseName: c.name,
        assignmentId,
        assignmentName,
        submittedAtISO: submittedAt,
        dueAtISO,
        onTime,
      });
    }
  }

  console.log(`[recent] summary: lookbackMinutes=${lookbackMinutes} matches=${results.length}`);
  return results;
}

export async function logRecentSubmissions(opts) {
  await checkRecentSubmissions(opts);
}

// ------------------------------------------------------------
// Weekly Progress (Canvas-driven)
// ------------------------------------------------------------

/** Internal: compute Sun..Sat window around "now" */
function _weekWindow(now = new Date()) {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Internal: format M/D (e.g., 9/14) */
function _md(d) {
  return d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
}

/** Internal: safe percent from a submission (score/points_possible) */
function _submissionPercent(sub) {
  const score = typeof sub?.score === "number" ? sub.score : null;
  const pts = typeof sub?.assignment?.points_possible === "number" ? sub.assignment.points_possible : null;
  if (score == null || pts == null || pts <= 0) return null;
  return (score / pts) * 100;
}

/**
 * Compute weekly summary & chart data from Canvas.
 * Returns:
 * {
 *   weekIndex: number,
 *   rangeLabel: "M/D - M/D",
 *   summary: { totalXp, maxStreak, avgAssignGradePct },
 *   grades: { days: string[], series: {name, points[]}[] },
 *   strengths: { negatives: string[], positives: string[] }
 * }
 *
 * NOTE on XP: we expose a hook `xpFromSubmissions(subs)` so you can plug your own
 * gamification rules. By default we set totalXp = 0 to stay truthful.
 */
export async function getWeeklyProgressData(now = new Date()) {
  const { start, end } = _weekWindow(now);

  // week index from SEMESTER_START (Sun..Sat buckets)
  const weeksSinceStart = Math.max(
    1,
    Math.floor((start.getTime() - new Date(SEMESTER_START).getTime()) / (7 * 86400000)) + 1
  );

  // Courses filtered by your existing rules (active, created after SEMESTER_START, has grades)
  const courses = await getMySemesterCoursesWithGrades(); // [{id,name,...}]

  // Recent submissions across all selected courses within the week (uses your server-side filter)
  const all = await checkRecentSubmissions({
    // look back 7 days is already default; we’ll client-trim to Sun..Sat exactly:
    lookbackMinutes: 60 * 24 * 7,
    now,
  });

  // Keep only those inside [start,end]
  const weeklySubs = all.filter(s => {
    const t = Date.parse(s.submittedAtISO ?? "");
    return Number.isFinite(t) && t >= start.getTime() && t <= end.getTime();
  });

  // ---------- Summary ----------
  // XP: plug your own rule here if you have one:
  function xpFromSubmissions(subs) {
    // TODO: integrate your existing XP engine.
    // For now, stay accurate (no made-up XP):
    return 0;
  }
  const totalXp = xpFromSubmissions(weeklySubs);

  // Highest daily submission streak this week (max consecutive days with >=1 submission)
  const submittedDay = new Array(7).fill(false);
  for (const s of weeklySubs) {
    const t = new Date(s.submittedAtISO);
    const dayIdx = (t.getDay() + 7) % 7; // 0..6
    submittedDay[dayIdx] = true;
  }
  let maxStreak = 0, cur = 0;
  for (let i = 0; i < 7; i++) {
    cur = submittedDay[i] ? cur + 1 : 0;
    if (cur > maxStreak) maxStreak = cur;
  }

  // Average assignment grade this week (from scored submissions only)
  const percents = [];
  for (const s of weeklySubs) {
    const p = _submissionPercent(s);
    if (typeof p === "number" && Number.isFinite(p)) percents.push(p);
  }
  const avgAssignGradePct = percents.length
    ? Math.round((percents.reduce((a, b) => a + b, 0) / percents.length) * 10) / 10
    : 0;

  // ---------- Weekly Grades chart ----------
  // x-axis labels: Sun..Sat
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  // For each course, create an array[7] with latest available score that day; if multiple,
  // take the last submission of that day; if none, carry forward the previous day's value.
  const courseIdToName = new Map(courses.map(c => [c.id, c.name]));
  const perCourseDaily = new Map(); // id -> number[7] with nulls
  for (const c of courses) perCourseDaily.set(c.id, new Array(7).fill(null));

  // Bucket submissions into days per course and choose last-of-day
  const lastSubIdx = {}; // key: `${courseId}-${dayIdx}` => percent
  for (const s of weeklySubs) {
    const courseId = s.courseId;
    if (!perCourseDaily.has(courseId)) continue;
    const dt = new Date(s.submittedAtISO);
    const dayIdx = dt.getDay(); // 0..6
    const pct = _submissionPercent(s);
    if (pct == null) continue;
    lastSubIdx[`${courseId}-${dayIdx}`] = pct; // overwrite -> last in array order
  }
  // Fill per-course arrays
  for (const [key, pct] of Object.entries(lastSubIdx)) {
    const [cidStr, dStr] = key.split("-");
    const cid = Number(cidStr);
    const di = Number(dStr);
    const arr = perCourseDaily.get(cid);
    if (arr) arr[di] = Math.max(0, Math.min(100, pct));
  }
  // Carry-forward so the lines look continuous (optional)
  for (const [cid, arr] of perCourseDaily) {
    for (let i = 1; i < 7; i++) {
      if (arr[i] == null) arr[i] = arr[i - 1];
    }
    // still null? set to 0 so chart has a baseline
    for (let i = 0; i < 7; i++) if (arr[i] == null) arr[i] = 0;
  }
  const series = [...perCourseDaily.entries()].map(([cid, arr]) => ({
    name: courseIdToName.get(cid) ?? `Course ${cid}`,
    points: arr,
  }));

  // ---------- Strengths/Improvements ----------
  const negatives = [];
  const positives = [];

  // Flag: <50% scores this week
  const lowScores = weeklySubs
    .map(_submissionPercent)
    .filter(p => typeof p === "number" && p < 50).length;
  if (lowScores >= 2) negatives.push(`Scored < 50% on ${lowScores} assignments (this week)`);

  // On-time submissions
  const onTimeCount = weeklySubs.filter(s => s.onTime === true).length;
  const lateCount = weeklySubs.filter(s => s.onTime === false).length;
  if (onTimeCount > 0) positives.push(`All on-time submissions: ${onTimeCount} (this week)`);
  if (lateCount > 0) negatives.push(`Late submissions: ${lateCount} (this week)`);

  // “Above average on X/Y” within week — compare to each course's current_score if available
  // (heuristic; Canvas doesn't expose weekly average directly)
  const above = [];
  for (const s of weeklySubs) {
    const percent = _submissionPercent(s);
    if (percent == null) continue;
    // use the course enrollment percent as a rough "course average"
    const courseCard = courses.find(c => c.id === s.courseId);
    const courseAvg = typeof courseCard?.percent === "number" ? courseCard.percent : 70;
    if (percent >= courseAvg) above.push(1);
  }
  if (above.length) positives.push(`Scored at/above course avg on ${above.length}/${weeklySubs.length} graded submissions`);

  return {
    weekIndex: weeksSinceStart,
    rangeLabel: `${_md(start)} - ${_md(end)}`,
    summary: { totalXp, maxStreak, avgAssignGradePct: Math.round(avgAssignGradePct) },
    grades: { days, series },
    strengths: { negatives, positives },
  };
}
