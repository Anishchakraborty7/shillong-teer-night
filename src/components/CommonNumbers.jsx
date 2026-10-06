import React from "react";

export function CommonNumbers({ commonNumbers, loading }) {
  if (loading) {
    return (
      <section id="common-numbers" className="section-block">
        <div className="section-container">
          <div className="target-table-box loading-skeleton-card">
            <div className="skeleton-title small"></div>
            <div className="skeleton-box" style={{ height: "100px" }}></div>
          </div>
        </div>
      </section>
    );
  }

  // Safe normalization of data
  let title = "SHILLONG";
  let direct = "48, 91";
  let house = "6";
  let ending = "2";

  if (commonNumbers && typeof commonNumbers === "object") {
    if (Array.isArray(commonNumbers)) {
      direct = commonNumbers.slice(0, 2).join(", ") || "--";
      house = commonNumbers[2] || "--";
      ending = commonNumbers[3] || "--";
    } else {
      title = commonNumbers.title || "SHILLONG";
      direct = commonNumbers.direct || "--";
      house = commonNumbers.house || "--";
      ending = commonNumbers.ending || "--";
    }
  }

  return (
    <section id="common-numbers" className="section-block">
      <div className="section-container">
        {/* Match Image 2 exact structure */}
        <div className="target-table-box" aria-label="Shillong Target Common Numbers">
          {/* Top Title: SHILLONG */}
          <div className="target-table-title">
            {title.toUpperCase()}
          </div>

          {/* Table Container */}
          <div className="target-table">
            {/* Headers row (Cyan background: Direct | House | Ending) */}
            <div className="target-table-row target-table-head">
              <div className="target-table-th">Direct</div>
              <div className="target-table-th">House</div>
              <div className="target-table-th">Ending</div>
            </div>

            {/* Values row */}
            <div className="target-table-row target-table-body">
              <div className="target-table-td" aria-label={`Direct numbers: ${direct}`}>
                {direct}
              </div>
              <div className="target-table-td" aria-label={`House: ${house}`}>
                {house}
              </div>
              <div className="target-table-td" aria-label={`Ending: ${ending}`}>
                {ending}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CommonNumbers;
