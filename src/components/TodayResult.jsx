import React from "react";
import { formatDisplayDate } from "../utils/dateUtils";

export function TodayResult({ currentResult, loading }) {
  if (loading) {
    return (
      <section id="today-result" className="hero-section">
        <div className="section-container">
          <div className="result-card loading-skeleton-card">
            <div className="skeleton-pill"></div>
            <div className="skeleton-title"></div>
            <div className="skeleton-date"></div>
            <div className="skeleton-boxes">
              <div className="skeleton-box"></div>
              <div className="skeleton-box"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Extract winning numbers array
  let numbers = [];
  if (currentResult?.numbers && Array.isArray(currentResult.numbers)) {
    numbers = currentResult.numbers.map(String).filter(Boolean);
  } else if (typeof currentResult?.result === "string" && currentResult.result.trim()) {
    numbers = currentResult.result
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (currentResult?.firstRound || currentResult?.secondRound) {
    numbers = [currentResult.firstRound, currentResult.secondRound].filter(Boolean).map(String);
  }

  const hasResult = numbers.length > 0;
  const gameTime = currentResult?.time ? String(currentResult.time).trim() : "";

  return (
    <section id="today-result" className="hero-section">
      <div className="section-container">
        <div className="result-card primary-result-card">
          <div className="card-badge">
            <span className="live-dot"></span>
            OFFICIAL NIGHT RESULT
          </div>

          <h2 className="brand-headline">SHILLONG TEER NIGHT</h2>
          <h1 className="section-title">
            TODAY'S RESULT
            {gameTime && <span className="game-time-bracket"> ({gameTime})</span>}
          </h1>

          {hasResult ? (
            <>
              <div className="result-date">
                {formatDisplayDate(currentResult.date).toUpperCase()}
                {gameTime && <span className="date-time-tag"> • ({gameTime})</span>}
              </div>

              {/* Single game result numbers (one or multiple comma-separated numbers) */}
              <div
                className={`daily-results-row ${numbers.length === 1 ? "single-result" : ""}`}
                aria-label={`Today's Game Result: ${numbers.join(", ")}`}
              >
                {numbers.map((num, idx) => (
                  <div key={idx} className="result-number-card">
                    <span className="result-number-val">{String(num)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state-container">
              <p className="empty-state-text">No result has been published yet.</p>
              <span className="empty-state-sub">Check back after the night archery game concludes.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default TodayResult;
