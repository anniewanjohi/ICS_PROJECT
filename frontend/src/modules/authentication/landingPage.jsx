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
    body { font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #1a2744; line-height: 1.6; -webkit-font-smoothing: antialiased; }

    .lp-nav { background: #1a2744; color: #fff; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 60px; position: sticky; top: 0; z-index: 100; }
    .lp-logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; color: #fff; text-decoration: none; }
    .lp-logo-mark { width: 30px; height: 30px; border-radius: 7px; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #D9A653; flex-shrink: 0; }
    .lp-nav-links { display: flex; align-items: center; gap: 4px; }
    .lp-nav-link { background: transparent; border: none; color: rgba(255,255,255,0.75); padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-decoration: none; }
    .lp-nav-link:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .lp-nav-right { display: flex; align-items: center; gap: 10px; }
    .lp-sign-in { background: rgba(255,255,255,0.12); border: none; color: #fff; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .lp-sign-in:hover { background: rgba(255,255,255,0.2); }
    .lp-cta-btn { background: #D9A653; color: #1a2744; border: none; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .lp-cta-btn:hover { background: #c8953d; }
    .lp-user-wrap { display: flex; align-items: center; gap: 10px; }
    .lp-user-av { width: 32px; height: 32px; border-radius: 50%; background: #D9A653; color: #1a2744; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }
    .lp-sign-out { background: rgba(255,255,255,0.1); border: none; color: rgba(255,255,255,0.8); padding: 5px 12px; border-radius: 7px; font-size: 12px; cursor: pointer; }

    .lp-hero { background: #1a2744; color: #fff; padding: 72px 24px 80px; }
    .lp-hero-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 1fr; gap: 60px; align-items: center; }
    .lp-hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(217,166,83,0.15); border: 1px solid rgba(217,166,83,0.3); color: #D9A653; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; }
    .lp-hero h1 { font-size: clamp(2rem, 3.5vw, 3rem); font-weight: 800; line-height: 1.12; color: #fff; margin-bottom: 18px; letter-spacing: -0.02em; font-family: inherit; }
    .lp-hero h1 em { font-style: italic; color: #D9A653; }
    .lp-hero-lead { font-size: 1rem; color: rgba(255,255,255,0.65); max-width: 440px; margin-bottom: 32px; line-height: 1.7; }
    .lp-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }
    .lp-btn-primary { background: #D9A653; color: #1a2744; border: none; padding: 11px 22px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
    .lp-btn-primary:hover { background: #c8953d; }
    .lp-btn-ghost { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 11px 22px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .lp-btn-ghost:hover { background: rgba(255,255,255,0.18); }
    .lp-hero-stats { display: flex; gap: 28px; }
    .lp-stat strong { display: block; font-size: 1.5rem; font-weight: 800; color: #D9A653; }
    .lp-stat span { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; }

    .lp-kiosk { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px; }
    .lp-kiosk-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .lp-kiosk-title { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #D9A653; }
    .lp-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); animation: lppulse 2.5s infinite; display: inline-block; }
    @keyframes lppulse { 0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.2); } 50% { box-shadow: 0 0 0 6px rgba(16,185,129,0.08); } }
    .lp-search-bar { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
    .lp-card { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
    .lp-card:last-child { margin-bottom: 0; }
    .lp-av { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .lp-av-gold { background: #D9A653; color: #1a2744; }
    .lp-av-blue { background: #5C7DA6; color: #fff; }
    .lp-av-green { background: #7BA88A; color: #1a2744; }
    .lp-card-info { flex: 1; min-width: 0; }
    .lp-card-name { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 1px; }
    .lp-card-sub { font-size: 11px; color: rgba(255,255,255,0.45); }
    .lp-badge { font-size: 10px; padding: 3px 9px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
    .lp-badge-green { background: rgba(16,185,129,0.15); color: #34d399; }
    .lp-badge-amber { background: rgba(245,158,11,0.15); color: #fbbf24; }
    .lp-badge-gray { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); }

    .lp-features { background: #fff; padding: 80px 24px; border-bottom: 1px solid #e2e8f0; }
    .lp-features-inner { max-width: 1100px; margin: 0 auto; }
    .lp-section-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #D9A653; margin-bottom: 8px; }
    .lp-section-title { font-size: clamp(1.5rem, 2.5vw, 2rem); font-weight: 800; color: #1a2744; margin-bottom: 8px; letter-spacing: -0.01em; }
    .lp-section-sub { font-size: 14px; color: #64748b; max-width: 520px; margin-bottom: 36px; }
    .lp-feat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
    .lp-feat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 16px; transition: all 0.2s; }
    .lp-feat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(26,39,68,0.1); }
    .lp-feat-icon { width: 36px; height: 36px; background: #1a2744; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; margin-bottom: 12px; }
    .lp-feat-card h3 { font-size: 13px; font-weight: 700; color: #1a2744; margin-bottom: 6px; }
    .lp-feat-card p { font-size: 13px; color: #64748b; line-height: 1.6; }

    .lp-steps { padding: 80px 24px; background: #f8fafc; }
    .lp-steps-inner { max-width: 1100px; margin: 0 auto; }
    .lp-steps-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-top: 36px; }
    .lp-step { position: relative; }
    .lp-step-num { width: 34px; height: 34px; background: #1a2744; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; margin-bottom: 12px; position: relative; z-index: 1; }
    .lp-step h3 { font-size: 13px; font-weight: 700; color: #1a2744; margin-bottom: 5px; }
    .lp-step p { font-size: 13px; color: #64748b; line-height: 1.6; }
    .lp-step-line { position: absolute; top: 17px; left: 34px; right: -20px; height: 1px; background: #e2e8f0; }
    .lp-step:last-child .lp-step-line { display: none; }

    .lp-cta { background: #1a2744; padding: 72px 24px; text-align: center; }
    .lp-cta h2 { font-size: clamp(1.5rem, 2.5vw, 2rem); font-weight: 800; color: #fff; margin-bottom: 10px; letter-spacing: -0.01em; }
    .lp-cta p { color: rgba(255,255,255,0.6); font-size: 14px; max-width: 400px; margin: 0 auto 24px; }
    .lp-cta-btns { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }

    .lp-footer { background: #fff; border-top: 1px solid #e2e8f0; padding: 40px 24px 24px; }
    .lp-footer-inner { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px; margin-bottom: 20px; }
    .lp-footer-brand p { color: #64748b; font-size: 13px; max-width: 240px; margin-top: 8px; line-height: 1.6; }
    .lp-footer-links { display: flex; gap: 40px; flex-wrap: wrap; }
    .lp-footer-col h4 { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; }
    .lp-footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .lp-footer-col a { color: #475569; text-decoration: none; font-size: 13px; }
    .lp-footer-col a:hover { color: #1a2744; }
    .lp-footer-bottom { border-top: 1px solid #e2e8f0; padding-top: 16px; max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 12px; color: #94a3b8; }

    @media (max-width: 900px) {
      .lp-hero-inner { grid-template-columns: 1fr; gap: 40px; }
      .lp-feat-grid { grid-template-columns: repeat(2,1fr); }
      .lp-steps-grid { grid-template-columns: repeat(2,1fr); }
      .lp-step-line { display: none; }
    }
    @media (max-width: 640px) {
      .lp-nav-links { display: none; }
      .lp-feat-grid, .lp-steps-grid { grid-template-columns: 1fr; }
    }
  `;

  return (
    <div>
      <style>{css}</style>

      <nav className="lp-nav">
        <a href="#home" className="lp-logo">
          <span className="lp-logo-mark">SD</span>
          SU Directory
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
      </nav>

      <section className="lp-hero" id="home">
        <div className="lp-hero-inner">
          <div>
            <div className="lp-hero-badge">📍 Strathmore University · Madaraka, Nairobi</div>
            <h1>Stop wandering the halls for someone who <em>just</em> left.</h1>
            <p className="lp-hero-lead">One searchable directory for every lecturer, mentor, administrator and student rep — with live availability and appointment booking, right in your browser.</p>
            <div className="lp-hero-btns">
              <button className="lp-btn-primary" onClick={() => setAuthOpen(true)}>Search the directory</button>
              <a href="#features" className="lp-btn-ghost">See how it works</a>
            </div>
            <div className="lp-hero-stats">
              <div className="lp-stat"><strong>4</strong><span>categories</span></div>
              <div className="lp-stat"><strong>1</strong><span>login</span></div>
              <div className="lp-stat"><strong>0</strong><span>installs</span></div>
            </div>
          </div>
          <div className="lp-kiosk">
            <div className="lp-kiosk-header">
              <span className="lp-kiosk-title">Directory</span>
              <span className="lp-dot" />
            </div>
            <div className="lp-search-bar">🔍 Search name, department, role...</div>
            {[
              { av: 'lp-av-gold', init: 'AO', name: 'Dr. A. Otieno', sub: 'Computer Science · Block C-412', badge: 'lp-badge-green', status: 'Available' },
              { av: 'lp-av-blue', init: 'MW', name: 'M. Wanjiru', sub: 'Mentorship · Block A-208', badge: 'lp-badge-amber', status: 'In a meeting' },
              { av: 'lp-av-green', init: 'FK', name: 'F. Kamau', sub: 'Student Affairs · Block A-103', badge: 'lp-badge-gray', status: 'Hours: 2–4 pm' },
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
                {i < 3 && <div className="lp-step-line" />}
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
            <a href="#home" className="lp-logo" style={{ color: '#1a2744' }}>
              <span className="lp-logo-mark">SD</span>
              SU Directory
            </a>
            <p>A centralised directory and appointment platform for Strathmore University.</p>
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <h4>Navigate</h4>
              <ul>
                {[['#home','Home'],['#features','Features'],['#how-it-works','How it works'],['#about','About']].map(([h,l]) => (
                  <li key={l}><a href={h}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Campus</h4>
              <ul>
                <li><a href="#">Ole Sangale Road, Madaraka</a></li>
                <li><a href="#">Nairobi, Kenya</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 Strathmore Directory · ICS Project, SCES</span>
          <span>React · Node.js · SQL Server</span>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
};

export default function App() {
  return <ThemeProvider><LandingPage /></ThemeProvider>;
}