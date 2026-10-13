import { useState } from "react";
import { login, getErrorMessage } from "../api";

function WalletIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M16 12h3" />
    </svg>
  );
}

export function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await login(email, password);
      onLogin(response.data.token);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-form card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <WalletIcon />
        </div>
        <h2>Финансы</h2>
        <p className="login-subtitle">
          Войдите, чтобы вести учёт доходов и расходов
        </p>

        <label className="login-field">
          <span>Email</span>
          <input
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="login-field">
          <span>Пароль</span>
          <input
            type="password"
            placeholder="Введите пароль"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
