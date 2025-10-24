// plus/minus 4.0 scale
export const GRADE_POINTS = {
    "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "D-": 0.7,
    "F": 0.0,
  };
  
  // percent → letter thresholds
  export function percentToLetter(p) {
    if (typeof p !== "number") return null;
    if (p >= 93) return "A";
    if (p >= 90) return "A-";
    if (p >= 87) return "B+";
    if (p >= 83) return "B";
    if (p >= 80) return "B-";
    if (p >= 77) return "C+";
    if (p >= 73) return "C";
    if (p >= 70) return "C-";
    if (p >= 67) return "D+";
    if (p >= 63) return "D";
    if (p >= 60) return "D-";
    return "F";
  }
  
  export function letterToPoints(letter, map = GRADE_POINTS) {
    const l = (letter || "").toUpperCase().trim();
    return Object.prototype.hasOwnProperty.call(map, l) ? map[l] : null;
  }
  
  /**
   * GPA with equal weighting because canvas does not conatin course weights
   * Accepts an array of { grade?: string|null, percent?: number|null }.
   */
  export function computeGPAEqualCredits(items) {
    const pts = [];
    for (const it of items || []) {
      const letter = it.grade || percentToLetter(it.percent);
      const p = letterToPoints(letter);
      if (typeof p === "number") pts.push(p);
    }
    if (pts.length === 0) return null;
    const avg = pts.reduce((a, b) => a + b, 0) / pts.length;
    return Math.round(avg * 100) / 100; // 2 decimals
  }
  