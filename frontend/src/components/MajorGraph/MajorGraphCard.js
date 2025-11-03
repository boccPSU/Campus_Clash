// ResponsiveHorizontalBar.js
import * as React from "react";
import { ChartContainer, BarPlot, BarLabel, ChartsXAxis } from "@mui/x-charts";

export default function MajorGraphCard({ data = [] }) {
    // Convert incoming rows to just label and xp
    const rows = Array.isArray(data)
        ? data
              .filter((r) => r?.major && r.major !== "Unknown")
              .map((r) => ({
                  label: r.major ?? r.label ?? "Unknown",
                  xp: Number(r.xp) || 0,
              }))
        : [];

    const hostRef = React.useRef(null);
    const [width, setWidth] = React.useState(360);
			
	// Allows graph to resize on screen change
    React.useEffect(() => {
        const measure = () => setWidth(hostRef.current?.clientWidth ?? 360);
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    //Height grows with rows
    const height = Math.max(240, rows.length * 32);

    return (
        <div ref={hostRef} className="majorChart w-100">
            <ChartContainer
                dataset={rows}
                width={width}
                height={height}
                series={[
                    {
                        type: "bar",
                        id: "xp",
                        dataKey: "xp",
                        layout: "horizontal",
                    },
                ]}
                xAxis={[{ scaleType: "linear", label: "XP" }]}
                yAxis={[
                    {
                        dataKey: "label",
                        scaleType: "band",
                        position: "right",
                        tickLabelStyle: { opacity: 0 },
                    },
                ]}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                sx={{
                    "--Charts-axisLeft-width": 0,
                    "--Charts-axisRight-width": 0,
                    "--Charts-axisTop-height": 0,
                    "--Charts-axisBottom-height": 20,
                }}
            >
                <BarPlot
                    barLabel={(item) => rows[item.dataIndex]?.label ?? ""}
                    slots={{ barLabel: BarLabel }}
                    slotProps={{ barLabel: { className: "barLabel" } }}
                />
                <ChartsXAxis />
            </ChartContainer>
        </div>
    );
}
