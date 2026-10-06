import React from "react";
import { formatDotDate, formatDisplayDate, compareDatesDesc, toISODateString } from "../utils/dateUtils";

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

  // Filter out the active today's result if present
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
            <div className="past-results-table-wrap" role="feed" aria-label="Past Results History">
              <table className="past-rounds-table">
                <thead>
                  <tr>
                    <th className="th-date">DATE</th>
                    <th className="th-round">F/R (08:30 PM)</th>
                    <th className="th-round">S/R (09:30 PM)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPast.map((item, idx) => {
                    let fVal = item.firstRound;
                    let sVal = item.secondRound;
                    let fTime = item.firstRoundTime || "08:30 PM";
                    let sTime = item.secondRoundTime || "09:30 PM";

                    // Fallback to legacy structure if needed
                    if (!fVal && !sVal) {
                      if (Array.isArray(item.numbers) && item.numbers.length > 0) {
                        fVal = item.numbers[0];
                        sVal = item.numbers[1] || "--";
                      } else if (typeof item.result === "string" && item.result.trim()) {
                        const parts = item.result.split(",").map((s) => s.trim());
                        fVal = parts[0] || "--";
                        sVal = parts[1] || "--";
                      }
                    }

                    return (
                      <tr key={item.id || item.date || idx} className="past-round-row">
                        <td className="td-date">
                          <span className="dot-date">{formatDotDate(item.date)}</span>
                          <span className="full-date-sub">{formatDisplayDate(item.date)}</span>
                        </td>
                        <td className="td-round">
                          <span className="round-badge fr-badge">{fVal || "--"}</span>
                        </td>
                        <td className="td-round">
                          <span className="round-badge sr-badge">{sVal || "--"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
