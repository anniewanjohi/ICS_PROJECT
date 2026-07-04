// src/modules/authentication/landingPage.jsx
import React, { useState, createContext, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import AuthModal from './AuthModal';

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);
export const ThemeProvider = ({ children }) => <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;

const LandingPage = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const { login, logout, isLoggedIn, user } = useAuth();

  const handleLoginSuccess = (userData, token, remember) => login(userData, token, remember);

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; background: #eef1f4; color: #29303a; line-height: 1.5; }

    a { color: #2f6fb5; }

    /* ---------- Top utility bar (matches AMS / eLearning contact strip) ---------- */
    .lp-topbar { background: #081b33; color: rgba(255,255,255,0.75); font-size: 12px; }
    .lp-topbar-inner { max-width: 1140px; margin: 0 auto; padding: 6px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
    .lp-topbar-contact { display: flex; gap: 18px; flex-wrap: wrap; }
    .lp-topbar-contact span { white-space: nowrap; }
    .lp-topbar-links { display: flex; gap: 14px; flex-wrap: wrap; }
    .lp-topbar-links a { color: rgba(255,255,255,0.75); text-decoration: none; }
    .lp-topbar-links a:hover { color: #fff; text-decoration: underline; }

    /* ---------- Main nav ---------- */
    .lp-nav { background: #fff; border-bottom: 1px solid #d7dde3; padding: 0 20px; }
    .lp-nav-inner { max-width: 1140px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .lp-logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; color: #0b2547; text-decoration: none; }
    .lp-logo-mark { width: 36px; height: 36px; border-radius: 4px; background: #0b2547; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .lp-logo-sub { display: block; font-size: 10px; font-weight: 500; color: #5b6774; letter-spacing: 0.04em; }
    .lp-nav-links { display: flex; align-items: center; gap: 2px; }
    .lp-nav-link { position: relative; background: transparent; border: none; color: #29303a; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; border-bottom: 3px solid transparent; }
    .lp-nav-link:hover { color: #0b2547; border-bottom-color: #c9a35c; }
    .lp-nav-right { display: flex; align-items: center; gap: 8px; }
    .lp-sign-in { background: #fff; border: 1px solid #0b2547; color: #0b2547; padding: 7px 16px; border-radius: 3px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .lp-sign-in:hover { background: #f0f4f8; }
    .lp-cta-btn { background: #0b2547; color: #fff; border: 1px solid #0b2547; padding: 7px 16px; border-radius: 3px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .lp-cta-btn:hover { background: #123a68; }
    .lp-user-wrap { display: flex; align-items: center; gap: 10px; }
    .lp-user-av { width: 32px; height: 32px; border-radius: 3px; background: #0b2547; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }
    .lp-sign-out { background: #fff; border: 1px solid #d7dde3; color: #29303a; padding: 6px 12px; border-radius: 3px; font-size: 12px; cursor: pointer; }
    .lp-sign-out:hover { background: #f4f6f8; }

    /* ---------- Hero ---------- */
    .lp-hero { background: #f4f6f8; border-bottom: 1px solid #d7dde3; padding: 48px 20px; }
    .lp-hero-inner { max-width: 1140px; margin: 0 auto; display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 40px; align-items: start; }
    .lp-hero-eyebrow { display: inline-block; background: #e7edf4; color: #0b2547; padding: 4px 10px; border-radius: 3px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 14px; border: 1px solid #d7dde3; }
    .lp-hero h1 { font-size: clamp(1.6rem, 2.6vw, 2.15rem); font-weight: 700; line-height: 1.3; color: #0b2547; margin-bottom: 14px; }
    .lp-hero-lead { font-size: 14px; color: #445064; max-width: 480px; margin-bottom: 22px; line-height: 1.7; }
    .lp-hero-btns { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 28px; }
    .lp-btn-primary { background: #0b2547; color: #fff; border: 1px solid #0b2547; padding: 10px 20px; border-radius: 3px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .lp-btn-primary:hover { background: #123a68; }
    .lp-btn-ghost { background: #fff; color: #0b2547; border: 1px solid #b7c2cf; padding: 10px 20px; border-radius: 3px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .lp-btn-ghost:hover { background: #f0f4f8; }
    .lp-hero-info { display: flex; gap: 24px; flex-wrap: wrap; border-top: 1px solid #d7dde3; padding-top: 18px; }
    .lp-info-item { font-size: 12px; color: #5b6774; }
    .lp-info-item strong { display: block; font-size: 13px; color: #0b2547; margin-bottom: 2px; }

    /* ---------- Directory card (Moodle-style boxed panel) ---------- */
    .lp-panel { background: #fff; border: 1px solid #d7dde3; border-radius: 4px; }
    .lp-panel-header { background: #0b2547; color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-radius: 4px 4px 0 0; }
    .lp-panel-title { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .lp-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; display: inline-block; }
    .lp-panel-body { padding: 16px; }
    .lp-search-bar { background: #f4f6f8; border: 1px solid #d7dde3; border-radius: 3px; padding: 9px 12px; font-size: 13px; color: #8492a3; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
    .lp-card { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e5e9ee; border-radius: 3px; padding: 10px 12px; margin-bottom: 8px; }
    .lp-card:last-child { margin-bottom: 0; }
    .lp-av { width: 34px; height: 34px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; color: #fff; }
    .lp-av-a { background: #0b2547; }
    .lp-av-b { background: #4c7ab5; }
    .lp-av-c { background: #7a8c9e; }
    .lp-card-info { flex: 1; min-width: 0; }
    .lp-card-name { font-size: 13px; font-weight: 700; color: #29303a; margin-bottom: 1px; }
    .lp-card-sub { font-size: 11px; color: #7c8798; }
    .lp-badge { font-size: 10px; padding: 3px 9px; border-radius: 3px; font-weight: 700; white-space: nowrap; }
    .lp-badge-green { background: #e4f7ea; color: #1e8e4f; }
    .lp-badge-amber { background: #fdf0dd; color: #b8762a; }
    .lp-badge-gray { background: #eef1f4; color: #64707f; }

    /* ---------- Features ---------- */
    .lp-features { background: #fff; padding: 56px 20px; border-bottom: 1px solid #d7dde3; }
    .lp-features-inner { max-width: 1140px; margin: 0 auto; }
    .lp-section-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b8762a; margin-bottom: 6px; }
    .lp-section-title { font-size: clamp(1.3rem, 2vw, 1.6rem); font-weight: 700; color: #0b2547; margin-bottom: 6px; }
    .lp-section-sub { font-size: 13px; color: #5b6774; max-width: 560px; margin-bottom: 28px; }
    .lp-feat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: #d7dde3; border: 1px solid #d7dde3; }
    .lp-feat-card { background: #fff; padding: 20px 18px; }
    .lp-feat-icon { width: 32px; height: 32px; background: #e7edf4; border: 1px solid #d7dde3; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 14px; margin-bottom: 12px; }
    .lp-feat-card h3 { font-size: 13px; font-weight: 700; color: #0b2547; margin-bottom: 6px; }
    .lp-feat-card p { font-size: 12.5px; color: #5b6774; line-height: 1.6; }

    /* ---------- Steps ---------- */
    .lp-steps { padding: 56px 20px; background: #f4f6f8; }
    .lp-steps-inner { max-width: 1140px; margin: 0 auto; }
    .lp-steps-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: #d7dde3; border: 1px solid #d7dde3; margin-top: 26px; }
    .lp-step { background: #fff; padding: 18px; position: relative; }
    .lp-step-num { width: 26px; height: 26px; background: #0b2547; color: #fff; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; margin-bottom: 10px; }
    .lp-step h3 { font-size: 13px; font-weight: 700; color: #0b2547; margin-bottom: 5px; }
    .lp-step p { font-size: 12.5px; color: #5b6774; line-height: 1.6; }

    /* ---------- CTA ---------- */
    .lp-cta { background: #0b2547; padding: 52px 20px; text-align: center; }
    .lp-cta h2 { font-size: clamp(1.3rem, 2vw, 1.6rem); font-weight: 700; color: #fff; margin-bottom: 8px; }
    .lp-cta p { color: rgba(255,255,255,0.65); font-size: 13px; max-width: 420px; margin: 0 auto 20px; }
    .lp-cta-btns { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
    .lp-cta .lp-btn-primary { background: #c9a35c; border-color: #c9a35c; color: #0b2547; }
    .lp-cta .lp-btn-primary:hover { background: #b8914c; }
    .lp-cta .lp-btn-ghost { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.3); }
    .lp-cta .lp-btn-ghost:hover { background: rgba(255,255,255,0.16); }

    /* ---------- Footer (mirrors AMS / eLearning footer structure) ---------- */
    .lp-footer { background: #fff; padding: 40px 20px 0; }
    .lp-footer-inner { max-width: 1140px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 28px; padding-bottom: 24px; }
    .lp-footer-brand { max-width: 300px; }
    .lp-footer-brand p { color: #5b6774; font-size: 12.5px; margin-top: 10px; line-height: 1.7; }
    .lp-footer-brand a.lp-readmore { display: inline-block; margin-top: 8px; font-size: 12.5px; font-weight: 700; }
    .lp-footer-links { display: flex; gap: 48px; flex-wrap: wrap; }
    .lp-footer-col h4 { font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0b2547; margin-bottom: 10px; }
    .lp-footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 7px; }
    .lp-footer-col a { color: #445064; text-decoration: none; font-size: 12.5px; }
    .lp-footer-col a:hover { color: #0b2547; text-decoration: underline; }
    .lp-footer-col p { color: #445064; font-size: 12.5px; line-height: 1.7; }
    .lp-footer-bottom { border-top: 1px solid #d7dde3; padding: 14px 0; max-width: 1140px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; font-size: 11.5px; color: #8492a3; }

    @media (max-width: 900px) {
      .lp-hero-inner { grid-template-columns: 1fr; gap: 28px; }
      .lp-feat-grid { grid-template-columns: repeat(2,1fr); }
      .lp-steps-grid { grid-template-columns: repeat(2,1fr); }
    }
    @media (max-width: 640px) {
      .lp-nav-links { display: none; }
      .lp-topbar-contact { display: none; }
      .lp-feat-grid, .lp-steps-grid { grid-template-columns: 1fr; }
    }
  `;

  return (
    <div>
      <style>{css}</style>

      <div className="lp-topbar">
        <div className="lp-topbar-inner">
          <div className="lp-topbar-contact">
            <span>📞 (+254) (0)703-034000</span>
            <span>✉ directory@strathmore.edu</span>
          </div>
          <div className="lp-topbar-links">
            {/* UPDATED: Real URLs for University Website, AMS (CAS login), eLearning, Library */}
            <a href="https://strathmore.edu" target="_blank" rel="noopener noreferrer">University Website</a>
            <a href="https://su-sso.strathmore.edu/cas-prd/login?service=https%3A%2F%2Fsu-sso.strathmore.edu%2Fsusams%2Fservlet%2Fedu%2Fstrathmore%2Fams%2Fsusams%2FInit.html" target="_blank" rel="noopener noreferrer">AMS</a>
            <a href="https://elearning.strathmore.edu" target="_blank" rel="noopener noreferrer">eLearning</a>
            <a href="https://opac.library.strathmore.edu" target="_blank" rel="noopener noreferrer">Library</a>
          </div>
        </div>
      </div>

      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#home" className="lp-logo">
            <span className="lp-logo-mark">SD</span>
            <span>
              SU Directory
              <span className="lp-logo-sub">Strathmore University</span>
            </span>
          </a>
          <div className="lp-nav-links">
            {[['#features','Features'],['#how-it-works','How it works'],['#about','About']].map(([h,l]) => (
              <a key={l} href={h} className="lp-nav-link">{l}</a>
            ))}
          </div>
          <div className="lp-nav-right">
            {isLoggedIn ? (
              <div className="lp-user-wrap">
                <div className="lp-user-av">{user?.email?.charAt(0).toUpperCase()}</div>
                <button className="lp-sign-out" onClick={logout}>Sign out</button>
              </div>
            ) : (
              <>
                <button className="lp-sign-in" onClick={() => setAuthOpen(true)}>Sign in</button>
                <button className="lp-cta-btn" onClick={() => setAuthOpen(true)}>Search directory</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="lp-hero" id="home">
        <div className="lp-hero-inner">
          <div>
            <div className="lp-hero-eyebrow">Madaraka, Nairobi · ICS Project, SCES</div>
            <h1>One directory for every lecturer, mentor, administrator and student rep.</h1>
            <p className="lp-hero-lead">Sign in with your Strathmore account to search the directory, check who's available right now, and book an appointment — no more wandering the halls for someone who just left.</p>
            <div className="lp-hero-btns">
              <button className="lp-btn-primary" onClick={() => setAuthOpen(true)}>Sign in to search</button>
              <a href="#features" className="lp-btn-ghost">See how it works</a>
            </div>
            <div className="lp-hero-info">
              <div className="lp-info-item"><strong>4 categories</strong>Lecturers, mentors, admin, reps</div>
              <div className="lp-info-item"><strong>1 login</strong>Your Strathmore credentials</div>
              <div className="lp-info-item"><strong>Live status</strong>See who's in and who's free</div>
            </div>
          </div>

          <div className="lp-panel">
            <div className="lp-panel-header">
              <span className="lp-panel-title">Directory preview</span>
              <span className="lp-dot" />
            </div>
            <div className="lp-panel-body">
              <div className="lp-search-bar">🔍 Search name, department, role...</div>
              {[
                { av: 'lp-av-a', init: 'AO', name: 'Dr. A. Otieno', sub: 'Computer Science · Block C-412', badge: 'lp-badge-green', status: 'Available' },
                { av: 'lp-av-b', init: 'MW', name: 'M. Wanjiru', sub: 'Mentorship · Block A-208', badge: 'lp-badge-amber', status: 'In a meeting' },
                { av: 'lp-av-c', init: 'FK', name: 'F. Kamau', sub: 'Student Affairs · Block A-103', badge: 'lp-badge-gray', status: 'Hours: 2–4 pm' },
              ].map((c, i) => (
                <div key={i} className="lp-card">
                  <div className={`lp-av ${c.av}`}>{c.init}</div>
                  <div className="lp-card-info">
                    <div className="lp-card-name">{c.name}</div>
                    <div className="lp-card-sub">{c.sub}</div>
                  </div>
                  <span className={`lp-badge ${c.badge}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-features" id="features">
        <div className="lp-features-inner">
          <div className="lp-section-tag">What's inside</div>
          <div className="lp-section-title">Everything you need to find the right person, fast</div>
          <div className="lp-section-sub">Built around the four groups students actually need to reach — lecturers, mentors, administrative staff, and student representatives.</div>
          <div className="lp-feat-grid">
            {[
              { icon: '🔍', title: 'Search and filter', desc: 'Find anyone by name, department, unit or role. Results show availability at a glance.' },
              { icon: '📅', title: 'Book appointments', desc: 'Pick an open slot from a profile, add a purpose, and submit. Staff confirm or decline.' },
              { icon: '👤', title: 'Rich profiles', desc: 'Staff set their office, hours and specialisation. Students flag their rep roles.' },
              { icon: '🔔', title: 'Notifications', desc: 'Get notified when bookings are confirmed, declined, or due — all in one inbox.' },
            ].map((f, i) => (
              <div key={i} className="lp-feat-card">
                <div className="lp-feat-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-steps" id="how-it-works">
        <div className="lp-steps-inner">
          <div className="lp-section-tag">Getting started</div>
          <div className="lp-section-title">From question to confirmed meeting in four steps</div>
          <div className="lp-section-sub">The same flow whether you're chasing a transcript, finding your mentor, or trying to catch a lecturer.</div>
          <div className="lp-steps-grid">
            {[
              { n: '1', title: 'Sign in', desc: 'Log in with your Strathmore email. Students, staff and admins each get their own view.' },
              { n: '2', title: 'Search', desc: 'Search by name, department or role. Filter by category. Results show availability.' },
              { n: '3', title: 'View profile', desc: 'See office location, contact details, and open time slots.' },
              { n: '4', title: 'Book', desc: 'Select a slot, add a purpose, and submit. You get notified of the outcome.' },
            ].map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta" id="about">
        <h2>Find them. See if they're in. Book your time.</h2>
        <p>Sign in with your Strathmore account to start using the directory.</p>
        <div className="lp-cta-btns">
          <button className="lp-btn-primary" onClick={() => setAuthOpen(true)}>Sign in to the directory</button>
          <a href="#features" className="lp-btn-ghost">Explore features</a>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <a href="#home" className="lp-logo" style={{ color: '#0b2547' }}>
              <span className="lp-logo-mark">SD</span>
              SU Directory
            </a>
            <p>A centralised directory and appointment platform for Strathmore University, built to help students reach the right lecturer, mentor, administrator or student rep without the guesswork.</p>
            <a href="#about" className="lp-readmore">Read more »</a>
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <h4>Info</h4>
              <ul>
                {/* UPDATED: Real URLs in footer */}
                <li><a href="https://opac.library.strathmore.edu" target="_blank" rel="noopener noreferrer">Library</a></li>
                <li><a href="https://strathmore.edu" target="_blank" rel="noopener noreferrer">Webmail</a></li>
                <li><a href="https://su-sso.strathmore.edu/cas-prd/login?service=https%3A%2F%2Fsu-sso.strathmore.edu%2Fsusams%2Fservlet%2Fedu%2Fstrathmore%2Fams%2Fsusams%2FInit.html" target="_blank" rel="noopener noreferrer">AMS Students' Module</a></li>
                <li><a href="https://elearning.strathmore.edu" target="_blank" rel="noopener noreferrer">Digital Repository</a></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Navigate</h4>
              <ul>
                {[['#home','Home'],['#features','Features'],['#how-it-works','How it works'],['#about','About']].map(([h,l]) => (
                  <li key={l}><a href={h}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Contact Us</h4>
              <p>Madaraka Estate, Ole Sangale Road<br/>PO Box 59857, 00200<br/>Nairobi, Kenya</p>
              <p style={{ marginTop: 8 }}>Phone: (+254) (0)703-034000<br/>Email: directory@strathmore.edu</p>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>Copyright © 2026 - Strathmore University Directory. All Rights Reserved.</span>
          <span>ICS Project, SCES · React · Node.js · SQL Server</span>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
};

export default function App() {
  return <ThemeProvider><LandingPage /></ThemeProvider>;
}