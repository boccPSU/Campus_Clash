import { useState, useEffect, useRef } from "react";
import { Container, Spinner } from "react-bootstrap";

import HeaderBar from "../components/HeaderBar/HeaderBar.js";
import BottomNav from "../components/BottomNav/BottomNav.js";
import InfoBox from "../components/InfoBox/InfoBox.js";
import ProgressSummaryCard from "../components/ProgressSummaryCard/ProgressSummaryCard.js";
import WeeklyGradesCard from "../components/WeeklyGradesCard/WeeklyGradesCard.js";
import StrengthsList from "../components/StrengthsList/StrengthsList.js";

import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../components/interaction/PullToRefresh.js";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll.js";

import { getWeeklyProgressData } from "../api/canvas";

export default function ProgressReport() {
  const [xp, setXp] = useState(10500);          // header XP (like Home)
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState(null);
  const [error, setError] = useState("");

  const scrollerRef = useRef(null);
  const collapsed = useCollapseOnScroll(scrollerRef);

  const loadWeekly = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await getWeeklyProgressData(new Date());
      setWeekData(data);
    } catch (e) {
      console.error(e);
      setError(e?.message ?? "Failed to load weekly progress.");
      setWeekData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeekly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    await loadWeekly();
    await new Promise((r) => setTimeout(r, 300));
  };

  const weekLabel =
    weekData ? `Week: ${weekData.weekIndex} • ${weekData.rangeLabel}` : "";

  return (
    <>
      <HeaderBar title="Progress Report" xp={xp} collapsed={collapsed} />
      <div className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`} />

      <ScreenScroll ref={scrollerRef}>
        <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
          <Container className="py-3 mb-5">
            {/* Summary */}
            <InfoBox title="Summary" className="darkCard">
              {loading && (
                <div className="d-flex align-items-center gap-2 py-2" aria-live="polite">
                  <Spinner animation="border" role="status" size="sm" />
                  <span>Loading summary…</span>
                </div>
              )}
              {!loading && !error && weekData && (
                <ProgressSummaryCard
                  totalXp={weekData.summary.totalXp}
                  maxStreak={weekData.summary.maxStreak}
                  avgAssignGradePct={weekData.summary.avgAssignGradePct}
                />
              )}
              {!loading && error && (
                <div className="text-danger" role="alert">{error}</div>
              )}
            </InfoBox>

            {/* Weekly Grades */}
            <InfoBox title="Weekly Grades" className="darkCard">
              {loading && (
                <div className="d-flex align-items-center gap-2 py-2">
                  <Spinner animation="border" role="status" size="sm" />
                  <span>Loading grades…</span>
                </div>
              )}
              {!loading && !error && weekData && (
                <WeeklyGradesCard
                  days={weekData.grades.days}
                  series={weekData.grades.series}
                />
              )}
            </InfoBox>

            {/* Strengths & Improvements */}
            <InfoBox title="Strengths and Improvements" className="darkCard">
              {loading && (
                <div className="d-flex align-items-center gap-2 py-2">
                  <Spinner animation="border" role="status" size="sm" />
                  <span>Analyzing this week…</span>
                </div>
              )}
              {!loading && !error && weekData && (
                <StrengthsList
                  negatives={weekData.strengths.negatives}
                  positives={weekData.strengths.positives}
                />
              )}
              {!loading && !error && weekData && !weekData.strengths.negatives.length && !weekData.strengths.positives.length && (
                <div className="text-muted">No notable insights yet this week.</div>
              )}
            </InfoBox>
          </Container>
        </PullToRefresh>

        <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
      </ScreenScroll>

      <BottomNav />
    </>
  );
}
