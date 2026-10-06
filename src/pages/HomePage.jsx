import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import TodayResult from "../components/TodayResult";
import CommonNumbers from "../components/CommonNumbers";
import PastResults from "../components/PastResults";
import Footer from "../components/Footer";
import { useResults } from "../hooks/useResults";

export function HomePage() {
  const { currentResult, pastResults, commonNumbers, loading, error, refreshResults } = useResults();
  const [activeSection, setActiveSection] = useState("today-result");

  // Track active scroll section for header highlight
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["today-result", "common-numbers", "past-results"];
      const scrollPos = window.scrollY + 180;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="site-wrapper">
      <Header activeSection={activeSection} />

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={refreshResults} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        <TodayResult currentResult={currentResult} loading={loading} />
        <CommonNumbers commonNumbers={commonNumbers} loading={loading} />
        <PastResults
          pastResults={pastResults}
          currentResultDate={currentResult?.date}
          loading={loading}
        />
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
