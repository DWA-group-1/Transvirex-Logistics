import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

function ChangePassword() {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // TODO: replace this with your real API call
      // await changePassword(newPassword);

      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
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
        }

        .glass-card {
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

        .glass-title {
          font-size: 28px;
          font-weight: 500;
          color: var(--font-color);
          text-align: center;
          margin: 0 0 10px;
          letter-spacing: 0.5px;
        }

        .glass-subtitle {
          text-align: center;
          color: color-mix(in srgb, var(--font-color) 75%, transparent);
          font-size: 14px;
          margin-bottom: 22px;
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
        }

        .glass-label {
          display: block;
          margin-top: 24px;
          font-size: 15px;
          font-weight: 500;
          color: var(--font-color);
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
          height: 50px;
          width: 100%;
          background: color-mix(in srgb, var(--font-color) 7%, transparent);
          border: none;
          border-radius: 3px;
          padding: 0 42px 0 34px;
          font-size: 14px;
          font-weight: 300;
          color: var(--font-color);
          font-family: 'Poppins', sans-serif;
          outline: none;
          box-sizing: border-box;
        }

        .glass-input::placeholder {
          color: var(--font-color);
          opacity: 0.7;
        }

        .glass-input:focus {
          background: var(--selected-color);
        }

        .glass-pw-toggle {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--font-color);
          font-size: 16px;
          display: grid;
          place-items: center;
          padding: 4px;
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
        }

        .glass-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
      `}</style>

      <div className="glass-root">
        <div className="glass-card">
          <div className="glass-brand">
            <div className="glass-brand-icon" aria-hidden="true">
              <img src="/leaf-svgrepo-com.svg" alt="" />
            </div>
            <div className="glass-brand-name">Transvirex Logistics</div>
          </div>

          <h1 className="glass-title">Change Password</h1>

          <p className="glass-subtitle">
            This is your first login. Please set a new password.
          </p>

          {error && (
            <div role="alert" className="glass-error">
              <i className="bi bi-exclamation-circle" aria-hidden="true" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="newPassword" className="glass-label">
              New Password
            </label>

            <div className="glass-input-wrap">
              <i className="bi bi-lock glass-input-icon" aria-hidden="true" />
              <input
                id="newPassword"
                type={showPw ? "text" : "password"}
                placeholder="New Password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                className="glass-input"
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

            <label htmlFor="confirmPassword" className="glass-label">
              Confirm Password
            </label>

            <div className="glass-input-wrap">
              <i className="bi bi-lock glass-input-icon" aria-hidden="true" />
              <input
                id="confirmPassword"
                type={showPw ? "text" : "password"}
                placeholder="Confirm Password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="glass-input"
              />
            </div>

            <button type="submit" disabled={loading} className="glass-submit">
              {loading ? "Changing…" : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ChangePassword;