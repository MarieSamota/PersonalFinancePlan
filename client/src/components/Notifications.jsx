import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

export function Notifications() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  useEffect(() => {
    function push(text, kind) {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, text, kind }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }

    function handleOnline({ email }) {
      push(`${email} – в сети`, "online");
    }

    function handleOffline({ email }) {
      push(`${email} – не в сети`, "offline");
    }

    function handleReminder({ from, planTitle }) {
      push(
        `${from} напоминает рассчитаться в купийке «${planTitle}»`,
        "reminder",
      );
    }

    function handleClosed({ title }) {
      push(`Купийка «${title}» закрыта – всё оплачено`, "closed");
    }

    socket.on("user online", handleOnline);
    socket.on("user offline", handleOffline);
    socket.on("reminder", handleReminder);
    socket.on("plan:closed", handleClosed);

    return () => {
      socket.off("user online", handleOnline);
      socket.off("user offline", handleOffline);
      socket.off("reminder", handleReminder);
      socket.off("plan:closed", handleClosed);
    };
  }, []);

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
