import React from "react";
import { formatDisplayDate, compareDatesDesc, toISODateString } from "../utils/dateUtils";

export function PastResults({ pastResults, currentResultDate, loading }) {
  if (loading) {
    return (
      <section id="past-results" className="section-block">
        <div className="section-container">
          <div className="content-card loading-skeleton-card">
            <div className="skeleton-title small"></div>
            <div className="skeleton-list">
              <div className="skeleton-list-item"></div>
              <div className="skeleton-list-item"></div>
              <div className="skeleton-list-item"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Filter out the active today's result if present, to ensure 24h requirement:
  // Today's result only belongs in Today's Result section until replaced on the next day.
  const activeDateISO = currentResultDate ? toISODateString(currentResultDate) : "";
  const filteredPast = (pastResults || []).filter((item) => {
    if (!item || !item.date) return false;
    if (activeDateISO && toISODateString(item.date) === activeDateISO) {
      return false;
    }
    return true;
  });

  // Sort newest first
  const sortedPast = [...filteredPast].sort((a, b) => compareDatesDesc(a.date, b.date));

  return (
    <section id="past-results" className="section-block">
      <div className="section-container">
        <div className="content-card past-results-card">
          <div className="section-header-compact">
            <h2 className="section-heading">PAST RESULTS</h2>
            <div className="heading-accent-line"></div>
          </div>

          {sortedPast.length > 0 ? (
            <div className="past-results-list" role="feed" aria-label="Past Results History">
              {sortedPast.map((item, idx) => {
                // Extract numbers for past item
                let numbers = [];
                if (Array.isArray(item.numbers) && item.numbers.length > 0) {
                  numbers = item.numbers.map(String).filter(Boolean);
                } else if (typeof item.result === "string" && item.result.trim()) {
                  numbers = item.result.split(",").map((s) => s.trim()).filter(Boolean);
                } else if (item.firstRound || item.secondRound) {
                  numbers = [item.firstRound, item.secondRound].filter(Boolean).map(String);
                }

                return (
                  <article key={item.id || item.date || idx} className="past-result-item">
                    <div className="past-date-header">
                      <span className="past-date-text">
                        {formatDisplayDate(item.date).toUpperCase()}
                        {item.time && (
                          <span className="past-time-tag"> ({item.time})</span>
                        )}
                      </span>
                    </div>

                    <div className="past-result-values" aria-label={`Result: ${numbers.join(", ")}`}>
                      {numbers.length > 0 ? (
                        numbers.map((num, nIdx) => (
                          <span key={nIdx} className="past-number-badge">
                            {String(num)}
                          </span>
                        ))
                      ) : (
                        <span className="past-number-badge">--</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-container">
              <p className="empty-state-text">No past results available.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PastResults;
