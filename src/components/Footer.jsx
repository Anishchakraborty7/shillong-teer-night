import React from "react";
import Logo from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="section-container footer-container">
        <div className="footer-brand">
          <Logo size={32} />
          <p className="footer-tagline">
            Official Results Portal for Shillong Teer Night archery rounds.
          </p>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p className="footer-disclaimer">
            Shillong Teer Night publishes daily archery results and common numbers for informational purposes only.
          </p>
          <p className="footer-copyright">
            &copy; {currentYear} Shillong Teer Night. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
