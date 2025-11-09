import { useMemo, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { Box } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import "./WeeklyGradesCard.scss";

const COLORS = ["#6FCFFF", "#91E0FF", "#A6EFFF", "#C2A6FF", "#F2A6FF", "#6FFFC5"];

export default function WeeklyGradesCard({ days, series }) {
  const [open, setOpen] = useState(false);

  const muiSeries = useMemo(
    () =>
      series.map((s, i) => ({
        id: s.name,
        label: s.name,
        data: s.points.map(v => Math.max(0, Math.min(100, v))),
        color: COLORS[i % COLORS.length],
        showMark: true,
      })),
    [series]
  );

  const chartStyle = {
    // axis lines + tick marks white
    ".MuiChartsAxis-line": { stroke: "#ffffff", strokeWidth: 2 },
    ".MuiChartsAxis-tick": { stroke: "#ffffff", strokeWidth: 2 },
    ".MuiChartsAxis-tickLabel": {
      fill: "#ffffff",
      fontWeight: 700,
      fontSize: "0.9rem",
    },
  
    // grid lines subtle gray
    ".MuiChartsGrid-horizontal line": { stroke: "rgba(255,255,255,0.15)" },
  
    // lines + dots more visible on dark
    ".MuiLineElement-root": { strokeWidth: 3 },
    ".MuiMarkElement-root": {
      r: 5,
      stroke: "#000000",
      strokeWidth: 1,
      fillOpacity: 1,
    },
  
    // chart background stays transparent over dark container
    ".MuiChartsSurface-root": { background: "transparent" },
  };
  

  return (
    <div className="weeklyGradesCard">
      <div className="wg-frame">
        {/* Legend compact: clip long names */}
        <div className="wg-legend">
          {muiSeries.map((s) => (
            <div key={s.id} className="wg-legend-item" title={s.label}>
              <span className="wg-dot" style={{ background: s.color }} />
              <span className="wg-legend-text">{s.label}</span>
            </div>
          ))}
        </div>

        <Box sx={{ width: "100%" }}>
            <LineChart
                xAxis={[{ scaleType: "point", data: days }]}
                series={muiSeries}
                height={260}
                sx={chartStyle}
                slotProps={{ legend: { hidden: true } }}
                margin={{ top: 20, right: 20, bottom: 40, left: 0 }}
/>
        </Box>

        <div className="wg-actions">
          <Button className="wg-enlarge" onClick={() => setOpen(true)}>Enlarge Graph</Button>
        </div>
      </div>

      <Modal show={open} onHide={() => setOpen(false)} size="lg" centered>
        <Modal.Body className="darkModal">
          <div className="wg-frame">
            <div className="wg-legend">
              {muiSeries.map((s) => (
                <div key={s.id} className="wg-legend-item" title={s.label}>
                  <span className="wg-dot" style={{ background: s.color }} />
                  <span className="wg-legend-text">{s.label}</span>
                </div>
              ))}
            </div>
            <Box sx={{ width: "100%" }}>
              <LineChart
                xAxis={[{ scaleType: "point", data: days }]}
                series={muiSeries}
                height={260}
                sx={chartStyle}
                slotProps={{ legend: { hidden: true } }}
                margin={{ top: 20, right: 20, bottom: 40, left: 0 }}
              />
            </Box>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
