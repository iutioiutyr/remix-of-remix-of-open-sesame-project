import './AppFooter.css'

export default function AppFooter() {
  return (
    <footer className="footer-root vjs-AppFooter">
      <div className="care-banner">
        <div className="care-inner">

          {/* Header row: icon + label */}
          <div className="care-left">
            <div className="care-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.07 2.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
              </svg>
            </div>
            <div>
              <p className="care-label">CUSTOMER CARE &amp; HELP</p>
              <p className="care-desc">Available Mon–Sat · 8am – 8pm EAT</p>
            </div>
          </div>

          {/* Phone numbers */}
          <div className="care-phones">
            <a href="tel:+256776208516" className="care-phone">
              <img className="care-flag" src="https://flagcdn.com/ug.svg" alt="Uganda" />
              <span className="care-num">+256 776 208516</span>
            </a>
          </div>

        </div>
      </div>
    </footer>
  )
}
