import React from "react";

export function CommonNumbers({ commonNumbers, loading }) {
  if (loading) {
    return (
      <section id="common-numbers" className="section-block">
        <div className="section-container">
          <div className="content-card loading-skeleton-card">
            <div className="skeleton-title small"></div>
            <div className="skeleton-pills-row">
              <div className="skeleton-pill-circle"></div>
              <div className="skeleton-pill-circle"></div>
              <div className="skeleton-pill-circle"></div>
              <div className="skeleton-pill-circle"></div>
              <div className="skeleton-pill-circle"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const hasNumbers = Array.isArray(commonNumbers) && commonNumbers.length > 0;

  return (
    <section id="common-numbers" className="section-block">
      <div className="section-container">
        <div className="content-card common-numbers-card">
          <div className="section-header-compact">
            <h2 className="section-heading">COMMON NUMBERS</h2>
            <div className="heading-accent-line"></div>
          </div>

          {hasNumbers ? (
            <div className="numbers-grid" aria-label="Current Common Numbers">
              {commonNumbers.map((num, idx) => (
                <div key={idx} className="number-token" title={`Common Number #${idx + 1}`}>
                  <span className="token-value">{String(num)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-container">
              <p className="empty-state-text">Common numbers will be updated soon.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CommonNumbers;
