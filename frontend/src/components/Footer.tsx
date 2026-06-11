import { useState } from "react";

type ModalKey = "privacy" | "terms" | "legal" | null;

interface LegalItem {
  key: ModalKey;
  icon: string;
  label: string;
  title: string;
  body: string;
}

const items: LegalItem[] = [
  {
    key: "privacy",
    icon: "bi-lock",
    label: "Privacy policy",
    title: "Privacy policy",
    body: "How we collect, use, and protect your personal data.",
  },
  {
    key: "terms",
    icon: "bi-file-text",
    label: "Terms of service",
    title: "Terms of service",
    body: "The rules and conditions for using this platform.",
  },
  {
    key: "legal",
    icon: "bi-hammer",
    label: "Legal notice",
    title: "Legal notice",
    body: "Company and open-source licensing information.",
  },
];

function PrivacyContent() {
  return (
    <div className="modal-body-content">
      <p className="modal-last-updated">Last updated: June 2026</p>

      <section>
        <h3>1. Who we are</h3>
        <p>
          Transvirex Logistics is a logistics management platform. This privacy
          policy explains how we handle your personal data when you use our
          platform.
        </p>
      </section>

      <section>
        <h3>2. GDPR compliance</h3>
        <p>
          We are committed to compliance with the General Data Protection
          Regulation (EU) 2016/679 (GDPR). Your rights under GDPR include:
        </p>
        <ul>
          <li>The right to access your personal data</li>
          <li>The right to rectification of inaccurate data</li>
          <li>The right to erasure ("right to be forgotten")</li>
          <li>The right to restrict processing</li>
          <li>The right to data portability</li>
          <li>The right to object to processing</li>
        </ul>
        <p>
          To exercise any of these rights, contact your system administrator.
        </p>
      </section>

      <section>
        <h3>3. Data we collect</h3>
        <p>We collect only what is necessary to operate the platform:</p>
        <ul>
          <li>
            <strong>Account data:</strong> email address, hashed password,
            assigned role
          </li>
          <li>
            <strong>Usage data:</strong> actions performed within the platform
            (deliveries, invoices, routes)
          </li>
          <li>
            <strong>Technical data:</strong> session tokens (JWT), stored
            locally in your browser
          </li>
        </ul>
        <p>
          We do not collect payment information, sell your data, or share it
          with advertisers.
        </p>
      </section>

      <section>
        <h3>4. Accessibility (WCAG 2.1)</h3>
        <p>
          Transvirex Logistics is designed to meet Web Content Accessibility
          Guidelines (WCAG) 2.1 Level AA. Our accessibility features include:
        </p>
        <ul>
          <li>
            <strong>Dark mode:</strong> full dark/light theme toggle to reduce
            eye strain
          </li>
          <li>
            <strong>Font size controls:</strong> increase, decrease, and reset
            text size across the entire application
          </li>
          <li>
            <strong>Screen reader support:</strong> ARIA labels, semantic HTML,
            and role attributes throughout the interface
          </li>
          <li>
            <strong>Keyboard navigation:</strong> all interactive elements are
            reachable and operable via keyboard
          </li>
          <li>
            <strong>Colour contrast:</strong> text and interactive elements meet
            WCAG AA contrast ratios
          </li>
          <li>
            <strong>Focus indicators:</strong> visible focus rings on all
            focusable elements
          </li>
        </ul>
        <p>
          If you encounter an accessibility barrier, please report it to your
          system administrator so we can address it.
        </p>
      </section>

      <section>
        <h3>5. Data retention</h3>
        <p>
          Account data is retained for as long as your account is active. Upon
          account deletion, personal data is removed within 30 days except where
          retention is required by law.
        </p>
      </section>

      <section>
        <h3>6. Cookies and local storage</h3>
        <p>
          This application uses browser local storage to store your
          authentication token and preferences (theme, font size). No
          third-party tracking cookies are used.
        </p>
      </section>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="modal-body-content">
      <p className="modal-last-updated">Last updated: June 2026</p>

      <section>
        <h3>1. Acceptance of terms</h3>
        <p>
          By accessing and using the Transvirex Logistics platform, you agree to
          be bound by these Terms of Service. If you do not agree, you must not
          use the platform.
        </p>
      </section>

      <section>
        <h3>2. Use of the platform</h3>
        <p>
          Access to this platform is granted solely for internal business
          operations of Transvirex Logistics. You agree to:
        </p>
        <ul>
          <li>Use the platform only for its intended purpose</li>
          <li>Keep your login credentials confidential</li>
          <li>
            Not attempt to access accounts or data that do not belong to you
          </li>
          <li>Not reverse-engineer, decompile, or tamper with the platform</li>
          <li>
            Report any security vulnerabilities to your administrator promptly
          </li>
        </ul>
      </section>

      <section>
        <h3>3. User accounts and roles</h3>
        <p>
          Accounts are created by managers and assigned a specific role (Driver,
          Dispatcher, Billing, or Manager). Access to features is limited to
          your assigned role. You are responsible for all activity under your
          account.
        </p>
      </section>

      <section>
        <h3>4. Passwords</h3>
        <p>
          You are required to change your temporary password upon first login.
          You must not share your password with anyone. Transvirex
          administrators will never ask for your password.
        </p>
      </section>

      <section>
        <h3>5. Data accuracy</h3>
        <p>
          You are responsible for the accuracy of data you enter into the
          platform, including delivery information, customer records, and
          invoices. Errors resulting from inaccurate data entry are your
          responsibility.
        </p>
      </section>

      <section>
        <h3>6. Availability</h3>
        <p>
          We aim to keep the platform available at all times but do not
          guarantee uninterrupted access. Scheduled maintenance will be
          communicated in advance where possible.
        </p>
      </section>

      <section>
        <h3>7. Termination</h3>
        <p>
          Accounts may be suspended or deleted by a manager at any time. Upon
          termination, your access to the platform ceases immediately.
        </p>
      </section>

      <section>
        <h3>8. Limitation of liability</h3>
        <p>
          The platform is provided "as is". To the extent permitted by law,
          Transvirex Logistics is not liable for any indirect, incidental, or
          consequential damages arising from your use of the platform.
        </p>
      </section>

      <section>
        <h3>9. Changes to these terms</h3>
        <p>
          We may update these terms from time to time. Continued use of the
          platform after changes are posted constitutes acceptance of the
          updated terms.
        </p>
      </section>
    </div>
  );
}

function LegalContent() {
  return (
    <div className="modal-body-content">
      <p className="modal-last-updated">Last updated: June 2026</p>

      <section>
        <h3>Publisher</h3>
        <p>
          <strong>Transvirex Logistics</strong>
          <br />
          This platform is developed and maintained as a student group project.
        </p>
      </section>

      <section>
        <h3>Open source</h3>
        <p>
          Transvirex Logistics is an open-source project. The source code is
          publicly available and distributed under the{" "}
          <strong>MIT License</strong>.
        </p>
        <p>
          This means you are free to use, copy, modify, merge, publish,
          distribute, sublicense, and/or sell copies of the software, subject to
          the following conditions:
        </p>
        <ul>
          <li>
            The original copyright notice and this permission notice must be
            included in all copies or substantial portions of the software
          </li>
          <li>
            The software is provided "as is", without warranty of any kind
          </li>
        </ul>
      </section>

      <section>
        <h3>Third-party technologies</h3>
        <p>
          This platform is built using the following open-source technologies:
        </p>
        <ul>
          <li>
            <strong>Frontend:</strong> React, TypeScript, Vite, React Bootstrap,
            React Router
          </li>
          <li>
            <strong>Backend:</strong> Python, FastAPI, SQLAlchemy, Alembic,
            PostgreSQL, Redis
          </li>
          <li>
            <strong>Infrastructure:</strong> Docker, Docker Compose
          </li>
        </ul>
        <p>
          Each of these projects is licensed under their respective open-source
          licenses.
        </p>
      </section>

      <section>
        <h3>Hosting</h3>
        <p>
          This platform is self-hosted. No third-party cloud hosting provider
          stores your data unless explicitly configured by your system
          administrator.
        </p>
      </section>

      <section>
        <h3>Contact</h3>
        <p>
          For any legal or technical inquiries, contact your system
          administrator.
        </p>
      </section>
    </div>
  );
}

export default function Footer() {
  const [open, setOpen] = useState<ModalKey>(null);

  const active = items.find((i) => i.key === open) ?? null;

  return (
    <>
      <style>{`
        .footer-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px 20px;
          flex-wrap: wrap;
          border-top: 0.5px solid color-mix(in srgb, var(--font-color) 10%, transparent);
          margin-top: 24px;
        }

        .footer-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          border: 0.5px solid color-mix(in srgb, var(--font-color) 15%, transparent);
          background: transparent;
          color: color-mix(in srgb, var(--font-color) 55%, transparent);
          font-size: 12px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          font-family: inherit;
        }

        .footer-btn:hover {
          background: var(--hover-color);
          border-color: color-mix(in srgb, var(--font-color) 25%, transparent);
          color: var(--font-color);
        }

        .footer-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--font-color) 25%, transparent);
          display: inline-block;
          flex-shrink: 0;
        }

        .ft-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .ft-modal {
          background: var(--bg-color);
          border: 0.5px solid color-mix(in srgb, var(--font-color) 15%, transparent);
          border-radius: 16px;
          width: 100%;
          max-width: 620px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .ft-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 0.5px solid color-mix(in srgb, var(--font-color) 10%, transparent);
          flex-shrink: 0;
        }

        .ft-modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--font-color);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ft-modal-header h2 i {
          font-size: 18px;
          color: #E2725B;
        }

        .ft-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 0.5px solid color-mix(in srgb, var(--font-color) 15%, transparent);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: color-mix(in srgb, var(--font-color) 60%, transparent);
          font-size: 16px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }

        .ft-close:hover {
          background: var(--hover-color);
          color: var(--font-color);
        }

        .ft-modal-scroll {
          overflow-y: auto;
          padding: 20px 24px 24px;
          flex: 1;
        }

        .modal-last-updated {
          font-size: 12px;
          color: color-mix(in srgb, var(--font-color) 45%, transparent);
          margin: 0 0 20px;
        }

        .modal-body-content section {
          margin-bottom: 20px;
        }

        .modal-body-content h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--font-color);
          margin: 0 0 8px;
        }

        .modal-body-content p {
          font-size: 13px;
          color: color-mix(in srgb, var(--font-color) 75%, transparent);
          line-height: 1.7;
          margin: 0 0 8px;
        }

        .modal-body-content ul {
          margin: 4px 0 8px;
          padding-left: 20px;
        }

        .modal-body-content li {
          font-size: 13px;
          color: color-mix(in srgb, var(--font-color) 75%, transparent);
          line-height: 1.7;
          margin-bottom: 4px;
        }

        .modal-body-content strong {
          color: var(--font-color);
          font-weight: 600;
        }
      `}</style>

      <div className="footer-wrap">
        <span
          style={{
            fontSize: 12,
            color: "color-mix(in srgb, var(--font-color) 40%, transparent)",
          }}
        >
          © 2026 Transvirex Logistics
        </span>

        {items.map((item, i) => (
          <>
            <span key={`dot-${i}`} className="footer-dot" />
            <button
              key={item.key}
              className="footer-btn"
              onClick={() => setOpen(item.key)}
            >
              <i
                className={`bi ${item.icon}`}
                aria-hidden="true"
                style={{ fontSize: 13 }}
              />
              {item.label}
            </button>
          </>
        ))}
      </div>

      {open && active && (
        <div className="ft-overlay" onClick={() => setOpen(null)}>
          <div
            className="ft-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
          >
            <div className="ft-modal-header">
              <h2>
                <i className={`bi ${active.icon}`} aria-hidden="true" />
                {active.title}
              </h2>
              <button
                className="ft-close"
                onClick={() => setOpen(null)}
                aria-label="Close"
              >
                <i className="bi bi-x" aria-hidden="true" />
              </button>
            </div>
            <div className="ft-modal-scroll">
              {open === "privacy" && <PrivacyContent />}
              {open === "terms" && <TermsContent />}
              {open === "legal" && <LegalContent />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
