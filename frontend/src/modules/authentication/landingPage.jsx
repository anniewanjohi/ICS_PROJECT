// src/modules/authentication/landingPage.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import AuthModal from './AuthModal';

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { login, logout, isLoggedIn, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Scroll reveal animation
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => observer.observe(el));
    return () => revealEls.forEach((el) => observer.unobserve(el));
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLoginSuccess = (userData, token, remember) => {
    login(userData, token, remember);
  };

  const handleLogout = () => logout();

  return (
    <div className="landing-page">
      <style>{`
        :root {
          --navy-deep: #0B2542;
          --navy: #16345C;
          --navy-soft: #22456f;
          --gold: #D9A653;
          --gold-deep: #B9852F;
          --cream: #F6F2E9;
          --paper: #FCFAF5;
          --ink: #1B2330;
          --slate: #6E7888;
          --line: rgba(11, 37, 66, 0.10);
          --green: #3E8E63;
          --amber: #C8862E;
          --radius: 14px;
          --primary-main: #D9A653;
          --primary-gradient: linear-gradient(135deg, #D9A653, #B9852F);
          --primary-gradient-hover: linear-gradient(135deg, #B9852F, #D9A653);
          --text-primary: #1B2330;
          --text-secondary: #6E7888;
          --bg-default: #F6F2E9;
          --bg-paper: #FCFAF5;
          --border-color: rgba(11, 37, 66, 0.10);
          --error: #d32f2f;
          --hover-bg: rgba(217, 166, 83, 0.1);
        }

        [data-theme="dark"] {
          --navy-deep: #0a1628;
          --navy: #0d1f3a;
          --navy-soft: #16345C;
          --cream: #121826;
          --paper: #1a1f2e;
          --ink: #E8EDF5;
          --slate: #8B94A8;
          --line: rgba(232, 237, 245, 0.12);
          --text-primary: #E8EDF5;
          --text-secondary: #8B94A8;
          --bg-default: #121826;
          --bg-paper: #1a1f2e;
          --border-color: rgba(232, 237, 245, 0.12);
          --hover-bg: rgba(217, 166, 83, 0.15);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        body {
          font-family: 'Inter', sans-serif;
          color: var(--ink);
          background: var(--cream);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        h1, h2, h3, h4 {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--navy-deep);
        }

        [data-theme="dark"] h1,
        [data-theme="dark"] h2,
        [data-theme="dark"] h3,
        [data-theme="dark"] h4 { color: var(--ink); }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.74rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold-deep);
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }

        .eyebrow::before {
          content: "";
          display: inline-block;
          width: 22px;
          height: 2px;
          background: var(--gold-deep);
        }

        .wrap { max-width: 1180px; margin: 0 auto; padding: 0 24px; }

        .theme-toggle {
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 40px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--ink);
          transition: all 0.2s;
        }
        .theme-toggle:hover { border-color: var(--gold); background: rgba(217, 166, 83, 0.1); }

        .user-menu { display: flex; align-items: center; gap: 12px; }

        .user-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: var(--gold);
          color: var(--navy-deep);
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 0.9rem;
          cursor: pointer; transition: transform 0.2s;
        }
        .user-avatar:hover { transform: scale(1.05); }

        .logout-btn {
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.8rem;
          cursor: pointer;
          color: var(--ink);
          transition: all 0.2s;
        }
        .logout-btn:hover { border-color: var(--error); color: var(--error); }

        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; padding: 13px 26px; border-radius: 999px;
          font-weight: 600; font-size: 0.95rem; text-decoration: none;
          border: 1px solid transparent; cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s, color 0.2s;
          white-space: nowrap;
        }
        .btn-primary { background: var(--gold); color: var(--navy-deep); box-shadow: 0 6px 18px -8px rgba(217, 166, 83, 0.7); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -8px rgba(217, 166, 83, 0.8); }
        .btn-ghost { background: transparent; color: var(--ink); border-color: var(--line); }
        .btn-ghost:hover { border-color: var(--gold); transform: translateY(-2px); }
        .btn-small { padding: 9px 16px; font-size: 0.82rem; }

        header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(246, 242, 233, 0.85);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        [data-theme="dark"] header { background: rgba(18, 24, 38, 0.85); }

        nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px; max-width: 1180px; margin: 0 auto;
        }

        .logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Fraunces', serif; font-weight: 700; font-size: 1.15rem;
          color: var(--navy-deep); text-decoration: none;
        }
        [data-theme="dark"] .logo { color: var(--ink); }

        .logo-mark {
          width: 34px; height: 34px; border-radius: 8px;
          background: var(--navy-deep);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
          font-family: 'IBM Plex Mono', monospace; font-size: 0.85rem; font-weight: 600;
          flex-shrink: 0;
        }

        .nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
        .nav-links a { color: var(--navy); text-decoration: none; font-weight: 500; font-size: 0.95rem; transition: color 0.2s; }
        [data-theme="dark"] .nav-links a { color: var(--slate); }
        .nav-links a:hover { color: var(--gold-deep); }

        .nav-cta { display: flex; align-items: center; gap: 14px; }

        .menu-toggle { display: none; background: none; border: none; cursor: pointer; padding: 6px; }
        .menu-toggle span { display: block; width: 24px; height: 2px; background: var(--navy-deep); margin: 5px 0; transition: 0.25s; }

        .hero { padding: 88px 0 96px; overflow: hidden; }
        .hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 64px; align-items: center; }
        .hero h1 { font-size: clamp(2.4rem, 4.4vw, 3.6rem); line-height: 1.1; margin-bottom: 22px; }
        .hero h1 em { font-style: italic; color: var(--gold-deep); }
        .hero p.lead { font-size: 1.08rem; color: var(--slate); max-width: 480px; margin-bottom: 34px; }
        .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 36px; }
        .hero-meta { display: flex; gap: 28px; flex-wrap: wrap; font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; color: var(--slate); }
        .hero-meta strong { color: var(--navy-deep); display: block; font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 700; margin-bottom: 2px; }
        [data-theme="dark"] .hero-meta strong { color: var(--gold); }

        .kiosk {
          background: var(--navy-deep); border-radius: 20px; padding: 26px;
          color: var(--paper); box-shadow: 0 30px 60px -30px rgba(11, 37, 66, 0.55);
          position: relative; isolation: isolate;
        }
        .kiosk::before {
          content: ""; position: absolute; inset: 0; border-radius: 20px;
          background: radial-gradient(120% 120% at 100% 0%, rgba(217, 166, 83, 0.18), transparent 60%);
          pointer-events: none; z-index: -1;
        }
        .kiosk-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .kiosk-title { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.22em; color: var(--gold); text-transform: uppercase; }
        .kiosk-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 4px rgba(62, 142, 99, 0.18); animation: pulse 2.4s infinite; }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(62, 142, 99, 0.18); }
          50% { box-shadow: 0 0 0 7px rgba(62, 142, 99, 0.10); }
        }

        .kiosk-search {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 13px 16px; margin-bottom: 18px;
          color: rgba(252,250,245,0.55); font-size: 0.9rem;
        }
        .kiosk-results { display: flex; flex-direction: column; gap: 10px; }
        .result-row {
          display: flex; align-items: center; gap: 14px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 14px; transition: background 0.2s, transform 0.2s;
        }
        .result-row:hover { background: rgba(255,255,255,0.08); transform: translateX(4px); }
        .avatar { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
        .avatar.a1 { background: #D9A653; color: #0B2542; }
        .avatar.a2 { background: #5C7DA6; color: #fff; }
        .avatar.a3 { background: #7BA88A; color: #0B2542; }
        .result-info { flex: 1; min-width: 0; }
        .result-name { font-weight: 600; font-size: 0.92rem; margin-bottom: 2px; }
        .result-sub { font-size: 0.78rem; color: rgba(252,250,245,0.55); }
        .status { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; letter-spacing: 0.06em; padding: 5px 10px; border-radius: 999px; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .status::before { content: ""; width: 6px; height: 6px; border-radius: 50%; }
        .status.available { background: rgba(62,142,99,0.16); color: #9FD9B7; }
        .status.available::before { background: var(--green); }
        .status.busy { background: rgba(200,134,46,0.16); color: #F0C589; }
        .status.busy::before { background: var(--amber); }
        .status.away { background: rgba(255,255,255,0.08); color: rgba(252,250,245,0.5); }
        .status.away::before { background: rgba(252,250,245,0.4); }

        .features-bg { background: var(--paper); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
        .section-head { max-width: 640px; margin-bottom: 56px; }
        .section-head h2 { font-size: clamp(1.9rem, 3vw, 2.6rem); line-height: 1.2; }
        .section-head p { color: var(--slate); font-size: 1.02rem; margin-top: 14px; }
        .feature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .feature-card { background: var(--cream); border: 1px solid var(--line); border-radius: var(--radius); padding: 28px 24px; transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 18px 40px -24px rgba(11,37,66,0.35); }
        .feature-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--navy-deep); color: var(--gold); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        .feature-card h3 { font-size: 1.08rem; margin-bottom: 8px; }
        .feature-card p { font-size: 0.92rem; color: var(--slate); }

        .steps { display: flex; flex-direction: column; }
        .step { display: grid; grid-template-columns: 120px 1fr; gap: 32px; padding: 34px 0; border-top: 1px solid var(--line); align-items: center; }
        .step:last-child { border-bottom: 1px solid var(--line); }
        .step-number { font-family: 'IBM Plex Mono', monospace; font-size: 0.85rem; color: var(--gold-deep); letter-spacing: 0.1em; display: flex; align-items: center; gap: 14px; }
        .step-number .num { font-family: 'Fraunces', serif; font-size: 2.6rem; font-weight: 700; color: var(--navy-deep); line-height: 1; }
        [data-theme="dark"] .step-number .num { color: var(--gold); }
        .step-content h3 { font-size: 1.18rem; margin-bottom: 6px; }
        .step-content p { color: var(--slate); font-size: 0.95rem; max-width: 560px; }
        .step-tag { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--slate); margin-bottom: 6px; display: block; }

        .about { background: var(--navy-deep); color: var(--paper); border-radius: 24px; margin: 0 24px; padding: 72px 56px; }
        .about-inner { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
        .about .eyebrow { color: var(--gold); }
        .about .eyebrow::before { background: var(--gold); }
        .about h2 { color: var(--paper); font-size: clamp(1.9rem, 3vw, 2.5rem); margin-bottom: 18px; line-height: 1.2; }
        .about p { color: rgba(252,250,245,0.72); font-size: 1rem; margin-bottom: 18px; }
        .about-stats { display: flex; flex-direction: column; gap: 24px; }
        .stat { border-top: 1px solid rgba(252,250,245,0.14); padding-top: 18px; }
        .stat strong { font-family: 'Fraunces', serif; font-size: 2rem; display: block; color: var(--gold); margin-bottom: 4px; }
        .stat span { font-size: 0.88rem; color: rgba(252,250,245,0.6); }

        .cta-strip { text-align: center; padding: 100px 24px; }
        .cta-strip h2 { font-size: clamp(2rem, 4vw, 2.8rem); max-width: 640px; margin: 0 auto 16px; line-height: 1.2; }
        .cta-strip p { color: var(--slate); max-width: 480px; margin: 0 auto 32px; }
        .cta-actions { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }

        footer { border-top: 1px solid var(--line); padding: 48px 0 36px; }
        .footer-grid { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 32px; margin-bottom: 32px; }
        .footer-brand p { color: var(--slate); font-size: 0.9rem; max-width: 280px; margin-top: 10px; }
        .footer-links { display: flex; gap: 48px; flex-wrap: wrap; }
        .footer-col h4 { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--slate); margin-bottom: 14px; font-weight: 600; }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-col a { color: var(--navy); text-decoration: none; font-size: 0.92rem; }
        [data-theme="dark"] .footer-col a { color: var(--slate); }
        .footer-col a:hover { color: var(--gold-deep); }
        .footer-bottom { border-top: 1px solid var(--line); padding-top: 24px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-size: 0.82rem; color: var(--slate); }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.in { opacity: 1; transform: translateY(0); }

        section { padding: 96px 0; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; gap: 48px; }
          .feature-grid { grid-template-columns: repeat(2, 1fr); }
          .about-inner { grid-template-columns: 1fr; gap: 40px; }
          .about { padding: 48px 28px; }
        }

        @media (max-width: 680px) {
          .nav-links { position: absolute; top: 100%; left: 0; right: 0; background: var(--paper); flex-direction: column; align-items: flex-start; padding: 24px; gap: 18px; border-bottom: 1px solid var(--line); display: none; }
          .nav-links.open { display: flex; }
          .menu-toggle { display: block; }
          .nav-cta .btn-ghost { display: none; }
          .feature-grid { grid-template-columns: 1fr; }
          .step { grid-template-columns: 1fr; gap: 10px; }
          .step-number { gap: 10px; }
          .hero { padding: 56px 0 64px; }
          section { padding: 64px 0; }
          .about { margin: 0 16px; }
          .footer-links { gap: 32px; }
        }
      `}</style>

      {/* Header */}
      <header>
        <nav>
          <a href="#home" className="logo">
            <span className="logo-mark">SD</span>
            Strathmore Directory
          </a>
          <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
            <li><a href="#home" onClick={closeMenu}>Home</a></li>
            <li><a href="#features" onClick={closeMenu}>Features</a></li>
            <li><a href="#how-it-works" onClick={closeMenu}>How It Works</a></li>
            <li><a href="#about" onClick={closeMenu}>About</a></li>
          </ul>
          <div className="nav-cta">
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            {isLoggedIn ? (
              <div className="user-menu">
                <div className="user-avatar" title={user?.email}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button onClick={handleLogout} className="logout-btn">Sign Out</button>
              </div>
            ) : (
              <>
                <button onClick={() => setAuthModalOpen(true)} className="btn btn-ghost btn-small">Sign in</button>
                <button onClick={() => setAuthModalOpen(true)} className="btn btn-primary btn-small">Search directory</button>
              </>
            )}
          </div>
          <button className="menu-toggle" onClick={toggleMenu}>
            <span></span><span></span><span></span>
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero" id="home">
        <div className="wrap hero-grid">
          <div className="reveal in">
            <div className="eyebrow">Strathmore University · Madaraka Campus</div>
            <h1>Stop wandering the halls for someone who <em>just</em> left.</h1>
            <p className="lead">
              One searchable directory for every lecturer, mentor, administrator and student
              rep at Strathmore — with office locations, contact details, live availability,
              and appointment booking, all from your browser.
            </p>
            <div className="hero-actions">
              <button onClick={() => setAuthModalOpen(true)} className="btn btn-primary">Search the directory</button>
              <a href="#features" className="btn btn-ghost">See how it works</a>
            </div>
            <div className="hero-meta">
              <div><strong>4</strong> personnel categories</div>
              <div><strong>1</strong> campus-wide login</div>
              <div><strong>0</strong> installs needed</div>
            </div>
          </div>

          <div className="reveal in" style={{ transitionDelay: '0.1s' }}>
            <div className="kiosk">
              <div className="kiosk-head">
                <span className="kiosk-title">Directory</span>
                <span className="kiosk-dot" title="Live status"></span>
              </div>
              <div className="kiosk-search">🔍&nbsp; Try "Computer Science" or "Dr. Otieno"</div>
              <div className="kiosk-results">
                <div className="result-row">
                  <div className="avatar a1">AO</div>
                  <div className="result-info">
                    <div className="result-name">Dr. A. Otieno</div>
                    <div className="result-sub">Computer Science · Office 4-12</div>
                  </div>
                  <span className="status available">Available</span>
                </div>
                <div className="result-row">
                  <div className="avatar a2">MW</div>
                  <div className="result-info">
                    <div className="result-name">M. Wanjiru</div>
                    <div className="result-sub">Mentorship Office · Office 2-08</div>
                  </div>
                  <span className="status busy">In a meeting</span>
                </div>
                <div className="result-row">
                  <div className="avatar a3">FK</div>
                  <div className="result-info">
                    <div className="result-name">F. Kamau</div>
                    <div className="result-sub">Student Affairs · Office 1-03</div>
                  </div>
                  <span className="status away">Hours: 2–4pm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-bg" id="features">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="eyebrow">What's inside</div>
            <h2>Everything you need to find the right person, fast</h2>
            <p>Built around the four groups students actually need to reach — lecturers, mentors, administrative staff, and student representatives.</p>
          </div>
          <div className="feature-grid">
            {[
              { icon: '🔍', title: 'Search & filter', desc: 'Find anyone by name, department, unit or role — no more guessing which office to walk into.' },
              { icon: '⏰', title: 'Live availability', desc: 'Every profile shows real-time status — in office, in a meeting, or on a break.' },
              { icon: '📅', title: 'Book appointments', desc: 'Pick an open slot straight from a profile and get instant confirmation.' },
              { icon: '👥', title: 'Staff & admin tools', desc: 'Staff keep their own profile and schedule up to date; admins manage everything.' }
            ].map((feature, i) => (
              <div key={i} className="feature-card reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="eyebrow">Getting there</div>
            <h2>From question to confirmed meeting in four steps</h2>
            <p>The same flow whether you're chasing a transcript, finding your mentor, or trying to catch a lecturer.</p>
          </div>
          <div className="steps">
            {[
              { num: '01', tag: 'Sign in', title: 'Log in with your Strathmore account', desc: 'Students, staff and admins each land on a view built for them.' },
              { num: '02', tag: 'Search', title: 'Search by name, department, unit or role', desc: "Type what you're looking for — the directory narrows it down instantly." },
              { num: '03', tag: 'Check details', title: 'Open a profile to see office, contact and status', desc: 'Every profile shows where they sit, how to reach them, and their availability.' },
              { num: '04', tag: 'Book', title: 'Reserve an open slot and get confirmation', desc: 'Choose a time, send the request, and receive confirmation — no walk-ins.' }
            ].map((step, i) => (
              <div key={i} className="step reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
                <div className="step-number"><span className="num">{step.num}</span></div>
                <div className="step-content">
                  <span className="step-tag">{step.tag}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about">
        <div className="about reveal">
          <div className="about-inner">
            <div>
              <div className="eyebrow">Why we built this</div>
              <h2>For every student who's stood outside the wrong office</h2>
              <p>At Strathmore, finding the right person has always meant piecing things together — a peer's tip, a WhatsApp group, an email that goes unanswered, or a walk across campus that ends with an empty office.</p>
              <p>The Strathmore Directory brings lecturers, mentors, administrative staff and student representatives into one searchable platform — with the information students actually need.</p>
              <p>It's a web app, so there's nothing to install — it works on any device with a browser and your Strathmore login.</p>
            </div>
            <div className="about-stats">
              <div className="stat"><strong>1 platform</strong><span>Replaces office visits, peer referrals and scattered WhatsApp groups</span></div>
              <div className="stat"><strong>Madaraka, Nairobi</strong><span>Built for Strathmore University's main campus</span></div>
              <div className="stat"><strong>Students · Staff · Admins</strong><span>Three tailored views, one shared directory</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-strip">
        <div className="wrap reveal">
          <h2>Find them. See if they're in. Book your time.</h2>
          <p>Sign in with your Strathmore account to start searching the directory.</p>
          <div className="cta-actions">
            <button onClick={() => setAuthModalOpen(true)} className="btn btn-primary">Sign in to the directory</button>
            <a href="#features" className="btn btn-ghost">Explore features</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#home" className="logo">
                <span className="logo-mark">SD</span>
                Strathmore Directory
              </a>
              <p>A centralized, searchable directory and appointment platform for Strathmore University students, staff and administrators.</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Navigate</h4>
                <ul>
                  <li><a href="#home">Home</a></li>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#how-it-works">How it works</a></li>
                  <li><a href="#about">About</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>For staff</h4>
                <ul>
                  <li><a href="#">Manage your profile</a></li>
                  <li><a href="#">Set availability</a></li>
                  <li><a href="#">View appointment requests</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Campus</h4>
                <ul>
                  <li><a href="#">Ole Sangale Road, Madaraka</a></li>
                  <li><a href="#">Nairobi, Kenya</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Strathmore Directory · ICS Project, School of Computing and Engineering Sciences</span>
            <span>Built with React, Node.js &amp; Express</span>
          </div>
        </div>
      </footer>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LandingPage />
    </ThemeProvider>
  );
}