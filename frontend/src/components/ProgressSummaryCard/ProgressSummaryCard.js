import { Card } from "react-bootstrap";
import "./ProgressSummaryCard.scss";

export default function ProgressSummaryCard({ totalXp, maxStreak, avgAssignGradePct }) {
  return (
    <Card className="progressSummaryCard">
      <div className="innerBox">
        <div className="summaryRow">
          <p className="description">Total XP Earned:</p>
          <p className="value">{(totalXp ?? 0).toLocaleString()} XP</p>
        </div>
        <div className="summaryRow">
          <p className="description">Highest Assignment Streak:</p>
          <p className="value">{maxStreak ?? 0}</p>
        </div>
        <div className="summaryRow">
          <p className="description">Average grade on assignments:</p>
          <p className="value">{avgAssignGradePct ?? 0}%</p>
        </div>
      </div>
    </Card>
  );
}
