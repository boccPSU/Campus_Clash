// src/api/canvas.js
//Frontend helper function to talk to backend proxy
const BACKEND_BASE = "http://localhost:3001";

//Helper function to build query strings, for example ?enrollment_state=active
//input is object like { a: 1, b: "x" } -> "?a=1&b=x"
function toQuery(params) {
  //if no params are passed return empty string
  if(!params){return "";}

  const usp = new URLSearchParams();  //browser API that safely encodes search pearams allows key value pairs to be stored as key=value
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) usp.append(k, String(v));
  }
  const qs = usp.toString();
  //if qs exists, return querry string 
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