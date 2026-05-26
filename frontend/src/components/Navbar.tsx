import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Nav, Offcanvas } from "react-bootstrap";

const navItems = [
  { label: "Dashboard",    icon: "bi-speedometer2",   path: "/home" },
  { label: "Track Orders", icon: "bi-truck",           path: "/track-orders" },
  { label: "Plan Routes",  icon: "bi-map",             path: "/plan-routes" },
  { label: "Invoices",     icon: "bi-currency-dollar", path: "/track-invoices" },
];



interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

function Navbar({ isDark, onToggleTheme }: NavbarProps) {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    return saved ? parseInt(saved) : 100;
  });

  useEffect(() => {
    document.body.style.fontSize = `${fontSize}%`;
  }, []);

  
  const handleClose = () => setShowMenu(false);
  const handleShow  = () => setShowMenu(true);

  const increaseFontSize = () => {
    if (fontSize < 150) {
      const n = fontSize + 10;
      setFontSize(n);
      document.body.style.fontSize = `${n}%`;
      localStorage.setItem("fontSize", n.toString());
    }
  };
  const decreaseFontSize = () => {
    if (fontSize > 70) {
      const n = fontSize - 10;
      setFontSize(n);
      document.body.style.fontSize = `${n}%`;
      localStorage.setItem("fontSize", n.toString());
    }
  };
  const resetFontSize = () => {
    setFontSize(100);
    document.body.style.fontSize = "100%";
    localStorage.setItem("fontSize", "100");
  };

  return (
    <>
      {/* ── Floating pill navbar ─────────────────────────────────────── */}
      <div style={{
        position: "sticky",
        top: 12,
        zIndex: 1030,
        padding: "0 16px",
        pointerEvents: "none",

      }}>
        <nav style={{
          pointerEvents: "all",
          background: "var(--bg-color)",
          borderRadius: 50,
          boxShadow: "0 2px 16px rgba(0,0,0,.08)",
          padding: "0 8px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}>

          {/* ── Logo ───────────────────────────────────────────────────── */}
          <Link
            to="/home"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              flexShrink: 0,
              paddingLeft: 8,
            }}
          >
            <img src="/leaf-svgrepo-com.svg" height={28} alt="" aria-hidden="true" />
            <span style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--main-color)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}>
              Transvirex
            </span>
          </Link>

          {/* ── Desktop links (hidden ≤ 900px) ─────────────────────────── */}
          <div className="nav-desktop-links" style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 50,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: "var(--font-color)",
                    background: active ? "var(--selected-color)" : "transparent",
                    transition: "background .15s, color .15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = "var(--hover-color)";
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {active && (
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--main-color)",
                      flexShrink: 0,
                    }} aria-hidden="true" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* ── Right : font size controls + burger ────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 4 }}>

            {/* ── Theme toggle ───────────────────────────────────────────── */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1.5px solid var(--selected-color)",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--font-color)",
              fontSize: 16,
              transition: "background .15s",
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--hover-color)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <i className={isDark ? "bi bi-sun" : "bi bi-moon"} aria-hidden="true" />
          </button>

            {/* Font size controls — hidden ≤ 600px */}
            <div
              className="nav-a11y-group"
              role="group"
              aria-label="Font size"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                background: "var(--bg-color)",
                border: "1px solid var(--selected-color)",
                borderRadius: 50,
                padding: "3px 6px",
              }}
            >
              <button onClick={decreaseFontSize} aria-label="Decrease font size" style={a11yBtn}>A−</button>
              <span
                style={{ fontSize: 11, color: "var(--font-color)", padding: "0 4px", minWidth: 34, textAlign: "center", opacity: 0.6 }}
                aria-live="polite"
                aria-atomic="true"
              >
                {fontSize}%
              </span>
              <button onClick={resetFontSize}    aria-label="Reset font size"    style={a11yBtn}>↺</button>
              <button onClick={increaseFontSize} aria-label="Increase font size" style={a11yBtn}>A+</button>
            </div>

            {/* Burger — shown ≤ 900px via CSS */}
            <button
              className="nav-burger"
              onClick={handleShow}
              aria-label="Open menu"
              aria-expanded={showMenu}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "1.5px solid var(--selected-color)",
                background: "transparent",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--font-color)",
                fontSize: 18,
                transition: "background .15s",
                flexShrink: 0,
              }}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </div>

      {/* ── Responsive CSS ───────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .nav-desktop-links { display: none !important; }
          .nav-burger         { display: flex !important; }
        }
        @media (max-width: 600px) {
          .nav-a11y-group { display: none !important; }
        }
        .nav-burger:hover {
          background: var(--hover-color) !important;
        }
        .nav-burger:focus-visible {
          outline: 2px solid var(--main-color);
          outline-offset: 2px;
        }
      `}</style>

      {/* ── Side drawer ──────────────────────────────────────────────────── */}
      <Offcanvas
        show={showMenu}
        onHide={handleClose}
        placement="end"
        style={{ width: 280, background: "var(--bg-color)" }}
      >
        <Offcanvas.Header
          closeButton
          style={{ borderBottom: "0.5px solid var(--selected-color)", padding: "1rem 1.25rem" }}
        >
          <Offcanvas.Title style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/leaf-svgrepo-com.svg" height={22} alt="" aria-hidden="true" />
            <span style={{ fontWeight: 600, fontSize: 15, color: "var(--main-color)" }}>
              Transvirex
            </span>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body style={{ padding: "0.75rem" }}>
          <Nav className="flex-column">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Nav.Link
                  key={item.label}
                  as={Link}
                  to={item.path}
                  onClick={handleClose}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    color: "var(--font-color)",
                    fontWeight: active ? 600 : 400,
                    background: active ? "var(--hover-color)" : "transparent",
                    marginBottom: 2,
                    transition: "background .15s",
                  }}
                >
                  <i
                    className={`bi ${item.icon}`}
                    aria-hidden="true"
                    style={{ fontSize: 18, color: active ? "var(--main-color)" : "var(--font-color)", opacity: active ? 1 : 0.5 }}
                  />
                  {item.label}
                </Nav.Link>
              );
            })}
          </Nav>

          {/* Font size controls in drawer (always visible on mobile) */}
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "var(--bg-color)",
            border: "1px solid var(--selected-color)",
            borderRadius: 12,
          }}>
            <p style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              color: "var(--font-color)",
              opacity: 0.5,
              marginBottom: 10,
              fontWeight: 600,
            }}>
              Font size
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={decreaseFontSize} aria-label="Decrease" style={drawerA11yBtn}>A−</button>
              <span
                style={{ flex: 1, textAlign: "center", fontSize: 13, color: "var(--font-color)" }}
                aria-live="polite"
                aria-atomic="true"
              >
                {fontSize}%
              </span>
              <button onClick={resetFontSize}    aria-label="Reset"    style={drawerA11yBtn}>↺</button>
              <button onClick={increaseFontSize} aria-label="Increase" style={drawerA11yBtn}>A+</button>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

// ── Shared button styles ─────────────────────────────────────────────────────

const a11yBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px 6px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  color: "var(--font-color)",
  lineHeight: 1,
  transition: "background .15s, color .15s",
};

const drawerA11yBtn: React.CSSProperties = {
  ...a11yBtn,
  background: "var(--bg-color)",
  border: "1px solid var(--selected-color)",
  padding: "6px 12px",
  borderRadius: 20,
  fontSize: 13,
};

export default Navbar;