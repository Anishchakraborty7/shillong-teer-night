import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import {
  fetchCurrentResult,
  fetchCommonNumbers,
  updateTodayResult,
  updateCommonNumbers
} from "../services/resultsService";
import { getTodayISODate, formatDisplayDate, formatDotDate } from "../utils/dateUtils";

export function AdminPanelPage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Today's Result Form State (2 Rounds: F/R and S/R matching Photo 1)
  const [resultDate, setResultDate] = useState(getTodayISODate());
  const [firstRoundTime, setFirstRoundTime] = useState("08:30 PM");
  const [firstRound, setFirstRound] = useState("");
  const [secondRoundTime, setSecondRoundTime] = useState("09:30 PM");
  const [secondRound, setSecondRound] = useState("");
  const [savingResult, setSavingResult] = useState(false);
  const [resultMessage, setResultMessage] = useState(null); // { type: 'success'|'error', text: '' }

  // Target Common Numbers Form State (Direct, House, Ending matching Photo 2)
  const [commonTitle, setCommonTitle] = useState("SHILLONG");
  const [commonDirect, setCommonDirect] = useState("");
  const [commonHouse, setCommonHouse] = useState("");
  const [commonEnding, setCommonEnding] = useState("");
  const [savingCommon, setSavingCommon] = useState(false);
  const [commonMessage, setCommonMessage] = useState(null);

  // Initial data load state
  const [initialLoading, setInitialLoading] = useState(true);

  // Protected route check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/admin/login", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load existing current result and common numbers on mount
  useEffect(() => {
    let isMounted = true;
    const loadCurrentData = async () => {
      try {
        const [current, common] = await Promise.all([
          fetchCurrentResult(),
          fetchCommonNumbers()
        ]);

        if (isMounted) {
          if (current) {
            setResultDate(current.date || getTodayISODate());
            setFirstRoundTime(current.firstRoundTime || "08:30 PM");
            setFirstRound(current.firstRound !== "--" ? current.firstRound : "");
            setSecondRoundTime(current.secondRoundTime || "09:30 PM");
            setSecondRound(current.secondRound !== "--" ? current.secondRound : "");
          }
          if (common) {
            setCommonTitle(common.title || "SHILLONG");
            setCommonDirect(common.direct !== "--" ? common.direct : "");
            setCommonHouse(common.house !== "--" ? common.house : "");
            setCommonEnding(common.ending !== "--" ? common.ending : "");
          }
        }
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    if (isAuthenticated) {
      loadCurrentData();
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Handle Today's 2-Round Result Update
  const handleUpdateTodayResult = async (e) => {
    e.preventDefault();
    setResultMessage(null);

    const cleanFRound = String(firstRound).trim();
    const cleanSRound = String(secondRound).trim();
    const cleanFTime = String(firstRoundTime).trim() || "08:30 PM";
    const cleanSTime = String(secondRoundTime).trim() || "09:30 PM";

    if (!resultDate) {
      setResultMessage({ type: "error", text: "Please enter a valid date." });
      return;
    }
    if (!cleanFRound && !cleanSRound) {
      setResultMessage({
        type: "error",
        text: "Please enter at least one round result (F/R or S/R). E.g. 06 or 88"
      });
      return;
    }

    setSavingResult(true);
    try {
      const updated = await updateTodayResult({
        date: resultDate,
        firstRound: cleanFRound || "--",
        firstRoundTime: cleanFTime,
        secondRound: cleanSRound || "--",
        secondRoundTime: cleanSTime
      });
      setResultMessage({
        type: "success",
        text: `Today's result updated successfully! F/R (${cleanFTime}): ${updated.firstRound} | S/R (${cleanSTime}): ${updated.secondRound}`
      });
    } catch (err) {
      console.error("Failed to update result:", err);
      setResultMessage({
        type: "error",
        text: err.message || "Failed to update today's result."
      });
    } finally {
      setSavingResult(false);
    }
  };

  // Handle Common Numbers Update (Direct, House, Ending)
  const handleUpdateCommonNumbers = async (e) => {
    e.preventDefault();
    setCommonMessage(null);

    const cleanTitle = String(commonTitle).trim() || "SHILLONG";
    const cleanDirect = String(commonDirect).trim();
    const cleanHouse = String(commonHouse).trim();
    const cleanEnding = String(commonEnding).trim();

    if (!cleanDirect && !cleanHouse && !cleanEnding) {
      setCommonMessage({
        type: "error",
        text: "Please enter values for Direct, House, or Ending."
      });
      return;
    }

    setSavingCommon(true);
    try {
      const updated = await updateCommonNumbers({
        title: cleanTitle,
        direct: cleanDirect || "--",
        house: cleanHouse || "--",
        ending: cleanEnding || "--"
      });
      setCommonMessage({
        type: "success",
        text: `Common numbers updated successfully! (${updated.title} -> Direct: ${updated.direct}, House: ${updated.house}, Ending: ${updated.ending})`
      });
    } catch (err) {
      console.error("Failed to update common numbers:", err);
      setCommonMessage({
        type: "error",
        text: err.message || "Failed to update common numbers."
      });
    } finally {
      setSavingCommon(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (authLoading || initialLoading) {
    return (
      <div className="admin-page-container">
        <div className="admin-card auth-card">
          <p className="admin-status-text">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-dashboard-layout">
        {/* Admin Header */}
        <header className="admin-header-bar">
          <div className="admin-header-left">
            <Logo size={36} showText={false} />
            <div>
              <h1 className="admin-title">SHILLONG TEER NIGHT ADMIN</h1>
              <span className="admin-user-badge">
                Logged in as: {user?.email || "Administrator"}
              </span>
            </div>
          </div>
          <div className="admin-header-right">
            <Link to="/" target="_blank" rel="noopener noreferrer" className="admin-view-site-link">
              View Public Site &rarr;
            </Link>
            <button onClick={handleLogout} className="admin-logout-btn">
              LOGOUT
            </button>
          </div>
        </header>

        {/* SECTION 1: TODAY'S RESULT (2 ROUNDS) */}
        <section className="admin-section-box">
          <div className="admin-section-title-row">
            <div>
              <h2 className="admin-section-heading">TODAY'S RESULT (2 ROUNDS)</h2>
              <span className="admin-section-hint">
                Updates F/R and S/R numbers. When advancing to a new date, yesterday's result is automatically archived into Past Results!
              </span>
            </div>
          </div>

          {resultMessage && (
            <div className={`admin-alert ${resultMessage.type}-alert`} role="alert">
              {resultMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateTodayResult} className="admin-form">
            <div className="admin-form-grid">
              <div className="form-group span-full">
                <label htmlFor="resultDate" className="form-label">
                  Result Date
                </label>
                <input
                  id="resultDate"
                  type="date"
                  className="form-input"
                  value={resultDate}
                  onChange={(e) => setResultDate(e.target.value)}
                  required
                />
                <span className="input-hint">
                  Header display preview: 🌙 Shillong Night Teer - {formatDotDate(resultDate)} ({formatDisplayDate(resultDate)})
                </span>
              </div>

              {/* First Round (F/R) */}
              <div className="form-group round-fieldset">
                <div className="round-fieldset-header">
                  <span className="round-tag">Round 1</span>
                  <strong>First Round (F/R)</strong>
                </div>
                <div className="round-input-row">
                  <div>
                    <label htmlFor="firstRoundTime" className="form-label">Time</label>
                    <input
                      id="firstRoundTime"
                      type="text"
                      className="form-input"
                      value={firstRoundTime}
                      onChange={(e) => setFirstRoundTime(e.target.value)}
                      placeholder="08:30 PM"
                    />
                  </div>
                  <div>
                    <label htmlFor="firstRound" className="form-label">Winning Number</label>
                    <input
                      id="firstRound"
                      type="text"
                      maxLength={5}
                      className="form-input result-input"
                      value={firstRound}
                      onChange={(e) => setFirstRound(e.target.value)}
                      placeholder="e.g. 06"
                    />
                  </div>
                </div>
                <span className="input-hint">Preview: F/R ({firstRoundTime}): {firstRound || "--"}</span>
              </div>

              {/* Second Round (S/R) */}
              <div className="form-group round-fieldset">
                <div className="round-fieldset-header">
                  <span className="round-tag">Round 2</span>
                  <strong>Second Round (S/R)</strong>
                </div>
                <div className="round-input-row">
                  <div>
                    <label htmlFor="secondRoundTime" className="form-label">Time</label>
                    <input
                      id="secondRoundTime"
                      type="text"
                      className="form-input"
                      value={secondRoundTime}
                      onChange={(e) => setSecondRoundTime(e.target.value)}
                      placeholder="09:30 PM"
                    />
                  </div>
                  <div>
                    <label htmlFor="secondRound" className="form-label">Winning Number</label>
                    <input
                      id="secondRound"
                      type="text"
                      maxLength={5}
                      className="form-input result-input"
                      value={secondRound}
                      onChange={(e) => setSecondRound(e.target.value)}
                      placeholder="e.g. 88"
                    />
                  </div>
                </div>
                <span className="input-hint">Preview: S/R ({secondRoundTime}): {secondRound || "--"}</span>
              </div>
            </div>

            {/* Live Visual Preview of Today's Result */}
            <div className="admin-live-preview-box">
              <span className="preview-label">Live Visitor View Preview:</span>
              <div className="teer-result-box preview-mini">
                <div className="teer-box-header">
                  <span className="teer-moon-icon">🌙</span>
                  <span className="teer-box-title">
                    Shillong Night Teer - {formatDotDate(resultDate)}
                  </span>
                </div>
                <div className="teer-rounds-grid">
                  <div className="teer-round-col">
                    <div className="teer-round-head">F/R ({firstRoundTime})</div>
                    <div className="teer-round-val">{firstRound || "--"}</div>
                  </div>
                  <div className="teer-round-col">
                    <div className="teer-round-head">S/R ({secondRoundTime})</div>
                    <div className="teer-round-val">{secondRound || "--"}</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="admin-btn primary-btn update-btn"
              disabled={savingResult}
            >
              {savingResult ? "UPDATING RESULT..." : "UPDATE TODAY'S RESULT"}
            </button>
          </form>
        </section>

        {/* SECTION 2: COMMON SECTION (DIRECT, HOUSE, ENDING) */}
        <section className="admin-section-box">
          <div className="admin-section-title-row">
            <div>
              <h2 className="admin-section-heading">COMMON SECTION (DIRECT | HOUSE | ENDING)</h2>
              <span className="admin-section-hint">
                Updates the 3-column target numbers box matching client specifications.
              </span>
            </div>
          </div>

          {commonMessage && (
            <div className={`admin-alert ${commonMessage.type}-alert`} role="alert">
              {commonMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateCommonNumbers} className="admin-form">
            <div className="admin-form-grid">
              <div className="form-group span-full">
                <label htmlFor="commonTitle" className="form-label">
                  Box Title
                </label>
                <input
                  id="commonTitle"
                  type="text"
                  className="form-input"
                  value={commonTitle}
                  onChange={(e) => setCommonTitle(e.target.value)}
                  placeholder="SHILLONG"
                />
              </div>

              <div className="form-group">
                <label htmlFor="commonDirect" className="form-label">
                  Direct Numbers
                </label>
                <input
                  id="commonDirect"
                  type="text"
                  className="form-input"
                  value={commonDirect}
                  onChange={(e) => setCommonDirect(e.target.value)}
                  placeholder="e.g. 48, 91"
                />
                <span className="input-hint">Comma separated (e.g. 48, 91)</span>
              </div>

              <div className="form-group">
                <label htmlFor="commonHouse" className="form-label">
                  House
                </label>
                <input
                  id="commonHouse"
                  type="text"
                  className="form-input"
                  value={commonHouse}
                  onChange={(e) => setCommonHouse(e.target.value)}
                  placeholder="e.g. 6"
                />
                <span className="input-hint">Target House digit(s)</span>
              </div>

              <div className="form-group">
                <label htmlFor="commonEnding" className="form-label">
                  Ending
                </label>
                <input
                  id="commonEnding"
                  type="text"
                  className="form-input"
                  value={commonEnding}
                  onChange={(e) => setCommonEnding(e.target.value)}
                  placeholder="e.g. 2"
                />
                <span className="input-hint">Target Ending digit(s)</span>
              </div>
            </div>

            {/* Live Visual Preview of Common Numbers */}
            <div className="admin-live-preview-box">
              <span className="preview-label">Live Visitor View Preview:</span>
              <div className="target-table-box preview-mini">
                <div className="target-table-title">{commonTitle.toUpperCase()}</div>
                <div className="target-table">
                  <div className="target-table-row target-table-head">
                    <div className="target-table-th">Direct</div>
                    <div className="target-table-th">House</div>
                    <div className="target-table-th">Ending</div>
                  </div>
                  <div className="target-table-row target-table-body">
                    <div className="target-table-td">{commonDirect || "--"}</div>
                    <div className="target-table-td">{commonHouse || "--"}</div>
                    <div className="target-table-td">{commonEnding || "--"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="common-actions-row">
              <button
                type="submit"
                className="admin-btn primary-btn update-btn"
                disabled={savingCommon}
              >
                {savingCommon ? "UPDATING COMMON NUMBERS..." : "UPDATE COMMON NUMBERS"}
              </button>
            </div>
          </form>
        </section>

        {/* Footer Logout */}
        <div className="admin-footer-bar">
          <button onClick={handleLogout} className="admin-btn logout-bottom-btn">
            LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPanelPage;
