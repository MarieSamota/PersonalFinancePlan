import { useCallback, useEffect, useMemo, useState } from "react";
import { setUnauthorizedHandler, getTokenUser } from "./api";
import { useSocketConnection } from "./hooks/useSocketConnection";
import { LoginForm } from "./components/LoginForm";
import { TransactionManager } from "./components/TransactionManager";
import { SharedPlans } from "./components/SharedPlans";
import { Notifications } from "./components/Notifications";
import "./App.css";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [view, setView] = useState("transactions");
  const user = useMemo(() => (token ? getTokenUser(token) : null), [token]);

  useEffect(() => {
    setUnauthorizedHandler(() => setToken(null));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  const connected = useSocketConnection(token, handleLogout);

  function handleLogin(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  if (!token) {
    return (
      <div className="app">
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Финансы</h1>
        <nav className="app-nav">
          <button
            className={view === "transactions" ? "active" : ""}
            onClick={() => setView("transactions")}
          >
            Транзакции
          </button>
          <button
            className={view === "plans" ? "active" : ""}
            onClick={() => setView("plans")}
          >
            Купийка
          </button>
        </nav>
        <div className="header-right">
          <span
            className={`connection ${connected ? "online" : ""}`}
            title={user?.email}
          >
            {connected ? "в сети" : "нет связи"}
          </span>
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </header>
      <Notifications />
      {view === "transactions" ? (
        <TransactionManager />
      ) : (
        <SharedPlans user={user} />
      )}
    </div>
  );
}

export default App;
