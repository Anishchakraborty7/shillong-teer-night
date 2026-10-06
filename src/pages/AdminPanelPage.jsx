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
import { getTodayISODate, formatDisplayDate } from "../utils/dateUtils";

export function AdminPanelPage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Today's Result Form State (Single game a day, comma separated for multiple numbers)
  const [resultDate, setResultDate] = useState(getTodayISODate());
  const [gameTime, setGameTime] = useState("8.30 PM");
  const [gameResult, setGameResult] = useState("");
  const [savingResult, setSavingResult] = useState(false);
  const [resultMessage, setResultMessage] = useState(null); // { type: 'success'|'error', text: '' }

  // Common Numbers Form State (5 standard slots with ability to add/remove if desired)
  const [commonNumbers, setCommonNumbers] = useState(["", "", "", "", ""]);
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
            setGameTime(current.time ? String(current.time) : "8.30 PM");
            if (current.result) {
              setGameResult(current.result);
            } else if (Array.isArray(current.numbers) && current.numbers.length > 0) {
              setGameResult(current.numbers.join(", "));
            } else if (current.firstRound || current.secondRound) {
              setGameResult(
                [current.firstRound, current.secondRound].filter(Boolean).join(", ")
              );
            }
          }
          if (Array.isArray(common) && common.length > 0) {
            const loaded = common.map(String);
            while (loaded.length < 5) loaded.push("");
            setCommonNumbers(loaded);
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

  // Handle Today's Result Update
  const handleUpdateTodayResult = async (e) => {
    e.preventDefault();
    setResultMessage(null);

    const cleanResult = String(gameResult).trim();
    const cleanTime = String(gameTime).trim() || "8.30 PM";

    if (!resultDate) {
      setResultMessage({ type: "error", text: "Please enter a valid date." });
      return;
    }
    if (!cleanResult) {
      setResultMessage({
        type: "error",
        text: "Please enter the game result number(s). E.g. 23 or 23, 45"
      });
      return;
    }

    setSavingResult(true);
    try {
      const updated = await updateTodayResult({
        date: resultDate,
        time: cleanTime,
        result: cleanResult
      });
      setResultMessage({
        type: "success",
        text: `Today's result updated successfully! (${formatDisplayDate(resultDate)} (${cleanTime}): ${updated.result})`
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

  // Handle Common Numbers Input Change
  const handleCommonNumberChange = (index, value) => {
    const updated = [...commonNumbers];
    updated[index] = value.trim();
    setCommonNumbers(updated);
  };

  const addCommonNumberSlot = () => {
    if (commonNumbers.length < 10) {
      setCommonNumbers([...commonNumbers, ""]);
    }
  };

  const removeCommonNumberSlot = (index) => {
    if (commonNumbers.length > 1) {
      const updated = commonNumbers.filter((_, idx) => idx !== index);
      setCommonNumbers(updated);
    }
  };

  // Handle Common Numbers Update
  const handleUpdateCommonNumbers = async (e) => {
    e.preventDefault();
    setCommonMessage(null);

    const filtered = commonNumbers
      .map((n) => String(n).trim())
      .filter((n) => n !== "");

    if (filtered.length === 0) {
      setCommonMessage({
        type: "error",
        text: "Please enter at least one common number."
      });
      return;
    }

    setSavingCommon(true);
    try {
      await updateCommonNumbers(filtered);
      setCommonMessage({
        type: "success",
        text: `Common numbers updated successfully! (${filtered.join("   ")})`
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

        {/* SECTION 1: TODAY'S RESULT */}
        <section className="admin-section-box">
          <div className="admin-section-title-row">
            <h2 className="admin-section-heading">TODAY'S RESULT</h2>
            <span className="admin-section-hint">
              One game a day. For multiple numbers, separate with comma (e.g. 23, 45). Changing date archives yesterday into Past Results.
            </span>
          </div>

          {resultMessage && (
            <div className={`admin-alert ${resultMessage.type}-alert`} role="alert">
              {resultMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateTodayResult} className="admin-form">
            <div className="admin-form-grid">
              <div className="form-group">
                <label htmlFor="resultDate" className="form-label">
                  Date
                </label>
                <input
                  id="resultDate"
                  type="date"
                  className="form-input"
                  value={resultDate}
                  onChange={(e) => setResultDate(e.target.value)}
                  required
                />
                <span className="input-hint">Preview: {formatDisplayDate(resultDate)}</span>
              </div>

              <div className="form-group">
                <label htmlFor="gameTime" className="form-label">
                  Game Time (e.g. 8.30 PM)
                </label>
                <input
                  id="gameTime"
                  type="text"
                  className="form-input"
                  value={gameTime}
                  onChange={(e) => setGameTime(e.target.value)}
                  placeholder="e.g. 8.30 PM"
                  required
                />
                <span className="input-hint">Shown in brackets: ({gameTime || "8.30 PM"})</span>
              </div>

              <div className="form-group span-full">
                <label htmlFor="gameResult" className="form-label">
                  Daily Game Result (Use comma "," for multiple numbers, e.g. "23, 45")
                </label>
                <input
                  id="gameResult"
                  type="text"
                  className="form-input result-input"
                  value={gameResult}
                  onChange={(e) => setGameResult(e.target.value)}
                  placeholder="e.g. 23 or 23, 45"
                  required
                />
                <span className="input-hint">
                  Supports single number or multiple numbers with leading zeros (e.g. "07, 88")
                </span>
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

        {/* SECTION 2: COMMON NUMBERS */}
        <section className="admin-section-box">
          <div className="admin-section-title-row">
            <h2 className="admin-section-heading">COMMON NUMBERS</h2>
            <span className="admin-section-hint">
              Replaces active common numbers. No historical records are stored.
            </span>
          </div>

          {commonMessage && (
            <div className={`admin-alert ${commonMessage.type}-alert`} role="alert">
              {commonMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateCommonNumbers} className="admin-form">
            <div className="common-inputs-row">
              {commonNumbers.map((num, idx) => (
                <div key={idx} className="common-slot-box">
                  <label className="slot-label">Number {idx + 1}</label>
                  <div className="slot-input-wrap">
                    <input
                      type="text"
                      maxLength={3}
                      className="form-input common-slot-input"
                      value={num}
                      onChange={(e) => handleCommonNumberChange(idx, e.target.value)}
                      placeholder={`#${idx + 1}`}
                    />
                    {commonNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCommonNumberSlot(idx)}
                        className="slot-delete-btn"
                        title="Remove slot"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="common-actions-row">
              {commonNumbers.length < 10 && (
                <button
                  type="button"
                  onClick={addCommonNumberSlot}
                  className="admin-btn secondary-btn"
                >
                  + Add Another Number
                </button>
              )}

              <button
                type="submit"
                className="admin-btn primary-btn update-btn"
                disabled={savingCommon}
              >
                {savingCommon ? "UPDATING NUMBERS..." : "UPDATE COMMON NUMBERS"}
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
