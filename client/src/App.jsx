import { useEffect, useState } from "react";
import { setUnauthorizedHandler } from "./api";
import { LoginForm } from "./components/LoginForm";
import { TransactionManager } from "./components/TransactionManager";
import "./App.css";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    setUnauthorizedHandler(() => setToken(null));
  }, []);

  function handleLogin(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return (
    <div className="app">
      {token && (
        <header className="app-header">
          <h1>Финансы</h1>
          <button onClick={handleLogout}>Выйти</button>
        </header>
      )}
      {token ? <TransactionManager /> : <LoginForm onLogin={handleLogin} />}
    </div>
  );
}

export default App;
