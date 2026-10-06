import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export function Header({ activeSection }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="header-brand-link" aria-label="Shillong Teer Night Home">
          <Logo size={40} />
        </Link>

        {/* Mobile menu hamburger toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
        >
          <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`}></span>
          <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`}></span>
          <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`}></span>
        </button>

        {/* Navigation links & right-side Admin Login */}
        <div className={`header-nav-wrap ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <nav className="header-nav">
            <button
              onClick={() => scrollTo("today-result")}
              className={`nav-link-btn ${activeSection === "today-result" ? "active" : ""}`}
            >
              Today's Result
            </button>
            <button
              onClick={() => scrollTo("common-numbers")}
              className={`nav-link-btn ${activeSection === "common-numbers" ? "active" : ""}`}
            >
              Common Numbers
            </button>
            <button
              onClick={() => scrollTo("past-results")}
              className={`nav-link-btn ${activeSection === "past-results" ? "active" : ""}`}
            >
              Past Results
            </button>
          </nav>

          <div className="header-auth-action">
            <Link
              to="/admin/login"
              className="header-login-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
