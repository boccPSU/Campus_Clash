import "./StrengthsList.scss";
export default function StrengthsList({ negatives = [], positives = [] }) {
    return (
      <div className="strengthsList">
        {negatives.map((t, i) => (
          <div key={`neg-${i}`} className="pill pill--bad">{t}</div>
        ))}
        {positives.map((t, i) => (
          <div key={`pos-${i}`} className="pill pill--good">{t}</div>
        ))}
      </div>
    );
  }
  