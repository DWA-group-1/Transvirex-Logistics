import { Container, Navbar as BootstrapNavbar } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Nav, Offcanvas } from "react-bootstrap";

const navItems = [
  { label: "Dashboard",    icon: "bi-speedometer2",    path: "/home" },
  { label: "Track Orders", icon: "bi-truck",            path: "/track-orders" },
  { label: "Plan Routes",  icon: "bi-map",              path: "/plan-routes" },
  { label: "Invoices",     icon: "bi-currency-dollar",  path: "/track-invoices" },
];

function Navbar() {
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
      {/* ── Barre flottante ───────────────────────────────────────────── */}
      <div style={{
        position: "sticky",
        top: 12,
        zIndex: 1030,
        padding: "0 16px",
        pointerEvents: "none",   // laisse les clics passer sur le fond
      }}>
        <nav style={{
          pointerEvents: "all",
          background: "#ffffff",
          borderRadius: 50,       // pilule
          boxShadow: "0 2px 16px rgba(0,0,0,.10)",
          padding: "0 8px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}>

          {/* ── Logo ─────────────────────────────────────────────────── */}
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
              color: "#C45B3E",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}>
              Transvirex
            </span>
          </Link>

          {/* ── Liens desktop (masqués ≤ 900px) ──────────────────────── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            // Responsive via className + CSS global — voir <style> ci-dessous
          }} className="nav-desktop-links">
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
                    color: active ? "#111" : "#555",
                    background: active ? "#f3f3f3" : "transparent",
                    transition: "background .15s, color .15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f7f7f7"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  {active && (
                    <span style={{
                      width: 6, height: 6,
                      borderRadius: "50%",
                      background: "#C45B3E",
                      flexShrink: 0,
                    }} aria-hidden="true" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* ── Droite : A± + burger ──────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 4 }}>

            {/* Contrôles taille — masqués ≤ 600px */}
            <div
              className="nav-a11y-group"
              role="group"
              aria-label="Taille du texte"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                background: "#f5f5f5",
                borderRadius: 50,
                padding: "3px 6px",
              }}
            >
              <button onClick={decreaseFontSize} aria-label="Réduire le texte" style={a11yBtn}>A−</button>
              <span style={{ fontSize: 11, color: "#888", padding: "0 4px", minWidth: 34, textAlign: "center" }}
                    aria-live="polite" aria-atomic="true">
                {fontSize}%
              </span>
              <button onClick={resetFontSize}    aria-label="Réinitialiser"   style={a11yBtn}>↺</button>
              <button onClick={increaseFontSize} aria-label="Agrandir le texte" style={a11yBtn}>A+</button>
            </div>

            {/* Burger — visible ≤ 900px */}
            <button
              className="nav-burger"
              onClick={handleShow}
              aria-label="Ouvrir le menu"
              aria-expanded={showMenu}
              style={{
                width: 38, height: 38,
                borderRadius: "50%",
                border: "1.5px solid #e5e5e5",
                background: "transparent",
                display: "none",        // affiché via CSS
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#333",
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

      {/* ── CSS responsive ────────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .nav-desktop-links { display: none !important; }
          .nav-burger         { display: flex !important; }
        }
        @media (max-width: 600px) {
          .nav-a11y-group { display: none !important; }
        }
        .nav-burger:hover { background: #f5f5f5 !important; }
        .nav-burger:focus-visible {
          outline: 2px solid #C45B3E;
          outline-offset: 2px;
        }
      `}</style>

      {/* ── Drawer latéral ───────────────────────────────────────────────── */}
      <Offcanvas
        show={showMenu}
        onHide={handleClose}
        placement="end"
        style={{ width: 280 }}
      >
        <Offcanvas.Header
          closeButton
          style={{ borderBottom: "0.5px solid #eee", padding: "1rem 1.25rem" }}
        >
          <Offcanvas.Title style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/leaf-svgrepo-com.svg" height={22} alt="" aria-hidden="true" />
            <span style={{ fontWeight: 600, fontSize: 15, color: "#C45B3E" }}>Transvirex</span>
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
                    color:      active ? "#111" : "#555",
                    fontWeight: active ? 600 : 400,
                    background: active ? "#fdf1ee" : "transparent",
                    marginBottom: 2,
                    transition: "background .15s",
                  }}
                >
                  <i
                    className={`bi ${item.icon}`}
                    aria-hidden="true"
                    style={{ fontSize: 18, color: active ? "#C45B3E" : "#888" }}
                  />
                  {item.label}
                </Nav.Link>
              );
            })}
          </Nav>

          {/* Contrôles taille dans le drawer (mobile) */}
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#f9f9f9",
            borderRadius: 12,
          }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "#888", marginBottom: 10, fontWeight: 600 }}>
              Taille du texte
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={decreaseFontSize} aria-label="Réduire" style={drawerA11yBtn}>A−</button>
              <span style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#555" }}
                    aria-live="polite" aria-atomic="true">
                {fontSize}%
              </span>
              <button onClick={resetFontSize}    aria-label="Réinitialiser" style={drawerA11yBtn}>↺</button>
              <button onClick={increaseFontSize} aria-label="Agrandir"      style={drawerA11yBtn}>A+</button>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

// ── Styles partagés ─────────────────────────────────────────────────────────

const a11yBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px 6px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  color: "#555",
  lineHeight: 1,
  transition: "background .15s, color .15s",
};

const drawerA11yBtn = {
  ...a11yBtn,
  background: "#fff",
  border: "1px solid #e5e5e5",
  padding: "6px 12px",
  borderRadius: 20,
  fontSize: 13,
};

export default Navbar;