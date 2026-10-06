import React from "react";
import { formatDotDate } from "../utils/dateUtils";

export function TodayResult({ currentResult, loading }) {
  if (loading) {
    return (
      <section id="today-result" className="hero-section">
        <div className="section-container">
          <div className="teer-result-box loading-skeleton-card">
            <div className="skeleton-title small"></div>
            <div className="teer-rounds-grid">
              <div className="skeleton-box" style={{ height: "90px" }}></div>
              <div className="skeleton-box" style={{ height: "90px" }}></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const dateStr = formatDotDate(currentResult?.date) || "TODAY";
  const fTime = currentResult?.firstRoundTime || "08:30 PM";
  const sTime = currentResult?.secondRoundTime || "09:30 PM";
  const fVal = currentResult?.firstRound || "--";
  const sVal = currentResult?.secondRound || "--";

  return (
    <section id="today-result" className="hero-section">
      <div className="section-container">
        {/* Match Image 1 exact structure */}
        <div className="teer-result-box" aria-label={`Shillong Night Teer Result for ${dateStr}`}>
          {/* Header Row: 🌙 Shillong Night Teer - DD.MM.YYYY */}
          <div className="teer-box-header">
            <span className="teer-moon-icon" aria-hidden="true">🌙</span>
            <h1 className="teer-box-title">
              Shillong Night Teer - {dateStr}
            </h1>
          </div>

          {/* 2 Rounds Grid: F/R (08:30 PM) | S/R (09:30 PM) */}
          <div className="teer-rounds-grid">
            {/* First Round Column */}
            <div className="teer-round-col col-fr">
              <div className="teer-round-head">
                F/R ({fTime})
              </div>
              <div className="teer-round-val" aria-label={`First round result: ${fVal}`}>
                {fVal}
              </div>
            </div>

            {/* Second Round Column */}
            <div className="teer-round-col col-sr">
              <div className="teer-round-head">
                S/R ({sTime})
              </div>
              <div className="teer-round-val" aria-label={`Second round result: ${sVal}`}>
                {sVal}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TodayResult;
