import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

interface LoginProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

function Login({ isDark, onToggleTheme }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Connection error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

        .glass-root {
          min-height: 100vh;
          background-color: var(--bg-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Poppins', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .glass-card {
          position: relative;
          z-index: 2;
          width: 400px;
          background: color-mix(in srgb, var(--hover-color) 8%, transparent);
          border-radius: 10px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid color-mix(in srgb, var(--selected-color) 8%, transparent);
          box-shadow: 0 0 40px color-mix(in srgb, var(--font-color) 8%, transparent);
          padding: 50px 35px 40px;
        }

        .glass-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }

        .glass-brand-icon img {
            height: 40px;
            filter: invert(48%) sepia(79%) saturate(476%) hue-rotate(86deg) brightness(95%) contrast(90%);
        }

        .glass-brand-name {
          font-size: 17px;
          font-weight: 600;
          color: var(--font-color);
          letter-spacing: 0.3px;
        }

        .glass-brand-sub {
          font-size: 11px;
          color: color-mix(in srgb, var(--font-color) 70%, transparent);
          letter-spacing: 0.3px;
        }

        .glass-title {
          font-size: 28px;
          font-weight: 500;
          color: var(--font-color);
          text-align: center;
          margin: 0 0 6px;
          letter-spacing: 0.5px;
        }

        .glass-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(198, 40, 40, 0.45);
          border: 1px solid rgba(239, 83, 80, 0.6);
          border-radius: 5px;
          padding: 10px 12px;
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--bg-color);
          letter-spacing: 0.3px;
        }

        .glass-label {
          display: block;
          margin-top: 28px;
          font-size: 15px;
          font-weight: 500;
          color: var(--font-color);
          letter-spacing: 0.5px;
        }

        .glass-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-top: 8px;
        }

        .glass-input-icon {
          position: absolute;
          left: 10px;
          color: color-mix(in srgb, var(--font-color) 50%, transparent);
          font-size: 15px;
          pointer-events: none;
        }

        .glass-input {
          display: block;
          height: 50px;
          width: 100%;
          background: color-mix(in srgb, var(--font-color) 7%, transparent);
          border: none;
          border-radius: 3px;
          padding: 0 10px 0 34px;
          font-size: 14px;
          font-weight: 300;
          color: var(--font-color);
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.5px;
          outline: none;
          transition: background 0.15s;
          box-sizing: border-box;
        }

        .glass-input::placeholder {
          color: var(--font-color);
          opacity: 0.7;
        }

        .glass-input:focus {
          background: var(--selected-color);
        }

        .glass-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .glass-input--pw {
          padding-right: 42px;
        }

        .glass-pw-toggle {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.45);
          font-size: 16px;
          display: grid;
          place-items: center;
          padding: 4px;
          transition: color 0.15s;
          line-height: 1;
        }

        .glass-pw-toggle:hover {
          color: rgba(255, 255, 255, 0.85);
        }

        .glass-submit {
          margin-top: 48px;
          width: 100%;
          background: var(--font-color);
          color: var(--bg-color);
          padding: 15px 0;
          font-size: 17px;
          font-weight: 600;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.5px;
          transition: opacity 0.15s;
        }

        .glass-submit:hover:not(:disabled) {
          opacity: 0.88;
        }

        .glass-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .glass-theme-row {
          margin-top: 28px;
          display: flex;
          justify-content: center;
        }

        .glass-theme-btn {
          background: color-mix(in srgb, var(--font-color) 50%, transparent);
          border: 1.5px solid color-mix(in srgb, var(--font-color) 50%, transparent);
          border-radius: 999px;
          padding: 8px 28px;
          cursor: pointer;
          color: var(--font-color);
          font-size: 13px;
          font-weight: 500;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s;
        }

        .glass-theme-btn:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        .glass-theme-btn i {
          font-size: 16px;
        }
      `}</style>

      <div className="glass-root">
        {/* Background blobs */}
        <div className="glass-shape glass-shape--blue" aria-hidden="true" />
        <div className="glass-shape glass-shape--orange" aria-hidden="true" />

        {/* Card */}
        <div className="glass-card">
          {/* Brand */}
          <div className="glass-brand">
            <div className="glass-brand-icon" aria-hidden="true">
              <img src="/leaf-svgrepo-com.svg" alt="" />
            </div>
            <div>
              <div className="glass-brand-name">Transvirex</div>
              <div className="glass-brand-sub">Logistics platform</div>
            </div>
          </div>

          <h1 className="glass-title">Login Here</h1>

          {/* Error */}
          {error && (
            <div role="alert" className="glass-error">
              <i className="bi bi-exclamation-circle" aria-hidden="true" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <label htmlFor="inputEmail" className="glass-label">
              Email
            </label>
            <div className="glass-input-wrap">
              <i
                className="bi bi-envelope glass-input-icon"
                aria-hidden="true"
              />
              <input
                id="inputEmail"
                type="email"
                placeholder="Email or Phone"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="glass-input"
              />
            </div>

            {/* Password */}
            <label htmlFor="inputPassword" className="glass-label">
              Password
            </label>
            <div className="glass-input-wrap">
              <i className="bi bi-lock glass-input-icon" aria-hidden="true" />
              <input
                id="inputPassword"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="glass-input glass-input--pw"
              />
              <button
                type="button"
                className="glass-pw-toggle"
                onClick={() => setShowPw((p) => !p)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <i
                  className={showPw ? "bi bi-eye-slash" : "bi bi-eye"}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="glass-submit">
              {loading ? "Signing in…" : "Log In"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
