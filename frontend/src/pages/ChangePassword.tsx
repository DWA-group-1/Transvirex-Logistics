// ChangePassword.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../services/api";

function ChangePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await changePassword(newPassword, confirmPassword);
      navigate("/home"); // Redirect to home after successful change
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-root">
      <div className="glass-card">
        <h1 className="glass-title">Change Your Password</h1>
        <p
          style={{
            color: "var(--font-color)",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          This is your first login. Please set a new password.
        </p>

        {error && (
          <div role="alert" className="glass-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="glass-label">New Password</label>
          <div className="glass-input-wrap">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <label className="glass-label">Confirm Password</label>
          <div className="glass-input-wrap">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="glass-submit">
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
