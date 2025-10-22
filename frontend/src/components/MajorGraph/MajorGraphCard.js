import { useEffect, useMemo, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import InfoBox from "../InfoBox/InfoBox";
import { BarChart } from "@mui/x-charts/BarChart";

function MajorGraphCard({ majors }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800); // simulate fetch
    return () => clearTimeout(t);
  }, []);

  //placeholder data if none passed in
  const demoMajors = [
    { major: "Computer Science", xp: 48000 },
    { major: "Mechanical Engineering", xp: 46000 },
    { major: "Electrical Engineering", xp: 45000 },
    { major: "Business Administration", xp: 43000 },
    { major: "Biology", xp: 41000 },
    { major: "Psychology", xp: 40000 },
    { major: "Nursing", xp: 38000 },
    { major: "Chemistry", xp: 37000 },
    { major: "Finance", xp: 35000 },
    { major: "Political Science", xp: 34000 },
    { major: "English Literature", xp: 32000 },
    { major: "Mathematics", xp: 30000 },
    { major: "Civil Engineering", xp: 29000 },
    { major: "Education", xp: 27000 },
    { major: "Marketing", xp: 26000 },
    { major: "History", xp: 25000 },
    { major: "Environmental Science", xp: 23500 },
    { major: "Sociology", xp: 22000 },
    { major: "Fine Arts", xp: 20000 },
    { major: "Philosophy", xp: 18000 },
  ];

  // use provided majors or fallback; sort desc by XP for a ranking feel
  const rows = useMemo(() => {
    const src = majors?.length ? majors : demoMajors;
    // normalize shape in case caller sends {rank, major, xp}
    const mapped = src.map((r) => ({
      major: r.major,
      xp: Number(r.xp ?? 0),
    }));
    return mapped.sort((a, b) => b.xp - a.xp);
  }, [majors]);

  // compute height based on bar count so labels don't collide
  const chartHeight = Math.max(260, rows.length * 26 + 90);

  if (loading) {
    return (
      <InfoBox title={"Major Graph"}>
        <div className="graphBox" style={{ height: 220, position: "relative" }}>
          <Spinner animation="border" role="status" className="spinner">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
        <button className="enlargeBtn">Enlarge Graph</button>
      </InfoBox>
    );
  }

  return (
    <InfoBox title={"Major Graph"}>
      <div className="graphBox" style={{ height: chartHeight, padding: 6 }}>
        <BarChart
          height={chartHeight - 20}
          // horizontal layout: numeric x, categorical y
          layout="horizontal"
          xAxis={[
            {
              label: "",
              min: 0,
              // allow the chart to auto-scale to max XP
              tickLabelStyle: { fill: "rgba(255,255,255,0.8)", fontSize: 12 },
            },
          ]}
          yAxis={[
            {
              data: rows.map((r) => r.major),
              scaleType: "band",
              tickLabelStyle: {
                fill: "rgba(255,255,255,0.9)",
                fontSize: 12,
              },
            },
          ]}
          series={[
            {
              label: "XP",
              data: rows.map((r) => r.xp),
              // compact bars
              barLabel: (item) => `${item.value.toLocaleString()}`,
              valueFormatter: (v) => v.toLocaleString(),
            },
          ]}
          margin={{ top: 34, right: 16, bottom: 24, left: 150 }}
          slotProps={{
            legend: {
              position: { vertical: "top", horizontal: "center" },
              direction: "row",
              padding: 0,
            },
          }}
          sx={{
            // dark card cosmetics
            "& .MuiChartsAxis-line": { stroke: "rgba(255,255,255,0.18)" },
            "& .MuiChartsAxis-tickLabel": { fill: "rgba(255,255,255,0.8)" },
            "& .MuiChartsGrid-line": { stroke: "rgba(255,255,255,0.08)" },
            "& .MuiBarElement-root": { rx: 4 }, // rounded bar ends
            "& .MuiChartsLegend-series text": {
              fill: "rgba(255,255,255,0.95)",
            },
            "& .MuiChartsBarLabel-root": {
              fill: "rgba(255,255,255,0.9)",
              fontSize: 11,
            },
          }}
        />
      </div>
      <button className="enlargeBtn">Enlarge Graph</button>
    </InfoBox>
  );
}

export default MajorGraphCard;
