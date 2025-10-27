import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Card, Button, Modal } from "react-bootstrap";
import { BarChart } from "@mui/x-charts";

const nf = new Intl.NumberFormat("en-US");

function useBoxWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(360);
  const measure = () => ref.current?.clientWidth && setW(ref.current.clientWidth);
  useLayoutEffect(measure, []);
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return [ref, w];
}

// abbreviated majors directly in dataset
const DEFAULT_DATA = [
  { major: "CS", xp: 48000 },
  { major: "ME", xp: 45500 },
  { major: "EE", xp: 44000 },
  { major: "Bus", xp: 41800 },
  { major: "Bio", xp: 40000 },
  { major: "Psych", xp: 38500 },
  { major: "Nurs", xp: 37000 },
  { major: "Chem", xp: 35500 },
  { major: "Fin", xp: 34000 },
  { major: "Poli Sci", xp: 32500 },
  { major: "Eng Lit", xp: 31000 },
  { major: "Math", xp: 30000 },
  { major: "CE", xp: 29000 },
  { major: "Edu", xp: 27500 },
  { major: "Mkt", xp: 26500 },
  { major: "Hist", xp: 25000 },
  { major: "Env Sci", xp: 23500 },
  { major: "Soc", xp: 22000 },
  { major: "Arts", xp: 19500 },
  { major: "Phil", xp: 17000 },
];

export default function MajorGraphCard({
  title = "Major Graph",
  data = DEFAULT_DATA,
}) {
  const rows = [...data].sort((a, b) => b.xp - a.xp);

  // card sizing
  const [wrapRef, width] = useBoxWidth();
  const isPhone = width < 430;
  const chartHeight = isPhone ? 320 : 420;

  // modal sizing
  const [show, setShow] = useState(false);
  const [modalRef, modalWidth] = useBoxWidth();

  // axis/grid styles
  const whiteAxisSX = {
    backgroundColor: "transparent",
    "& .MuiChartsAxis-tickLabel, & .MuiChartsLegend-label": { fill: "#ffffff" },
    "& .MuiChartsAxis-label": { fill: "#ffffff" },
    "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": { stroke: "#ffffff" },
    "& .MuiChartsGrid-line": { stroke: "rgba(255,255,255,0.2)" },
  };

  const darkAxisSX = {
    backgroundColor: "transparent",
    "& .MuiChartsAxis-tickLabel, & .MuiChartsLegend-label": { fill: "#1f2937" },
    "& .MuiChartsAxis-label": { fill: "#1f2937" },
    "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": { stroke: "#1f2937" },
    "& .MuiChartsGrid-line": { stroke: "rgba(31,41,55,0.18)" },
  };

  return (
    <>
      <Card className="shadow-sm rounded-4 bg-dark border border-primary">
        <Card.Body>
          <h2 className="text-center text-light fw-bold mb-2">{title}</h2>

          <div ref={wrapRef} className="w-100">
            <BarChart
              dataset={rows}
              layout="horizontal"
              width={width}
              height={chartHeight}
              series={[{ dataKey: "xp", label: isPhone ? undefined : "XP" }]}
              xAxis={[{
                scaleType: "linear",
                label: "XP",
                valueFormatter: (v) => nf.format(v),
                tickLabelStyle: { fontSize: isPhone ? 10 : 12, fill: "#ffffff" },
                labelStyle: { fill: "#ffffff" },
              }]}
              yAxis={[{
                scaleType: "band",
                dataKey: "major",
                tickLabelStyle: { fontSize: isPhone ? 10 : 12, fill: "#ffffff" },
              }]}
              margin={{ top: 0, right: 10, bottom: 28, left: 10 }}
              grid={{ vertical: false, horizontal: true }}
              slotProps={{ legend: { hidden: true }, tooltip: { trigger: "none" } }}
              sx={whiteAxisSX} // white axes for dark card
            />
          </div>

          <div className="d-flex justify-content-center">
            <Button
              variant="primary"
              className="mt-3 rounded-pill px-4 fw-semibold"
              onClick={() => setShow(true)}
            >
              Enlarge Graph
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div ref={modalRef} className="w-100">
            <BarChart
              dataset={rows}
              layout="horizontal"
              width={modalWidth}
              height={600}
              series={[{ dataKey: "xp", label: "XP" }]}
              xAxis={[{
                scaleType: "linear",
                label: "XP",
                valueFormatter: (v) => nf.format(v),
                tickLabelStyle: { fontSize: 12, fill: "#1f2937" },
                labelStyle: { fill: "#1f2937" },
              }]}
              yAxis={[{
                scaleType: "band",
                dataKey: "major",
                tickLabelStyle: { fontSize: 12, fill: "#1f2937" },
              }]}
              margin={{ top: 20, right: 24, bottom: 40, left: 40 }}
              grid={{ vertical: false, horizontal: true }}
              slotProps={{ legend: { hidden: true }, tooltip: { trigger: "none" } }}
              sx={darkAxisSX}
            />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
