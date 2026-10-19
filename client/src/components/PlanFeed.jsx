import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { formatTime } from "../format";

export function PlanFeed({ planId, messages, typingEmail, closed, onSend }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const lastTyping = useRef(0);

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  function handleChange(e) {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTyping.current > 1000) {
      lastTyping.current = now;
      socket.emit("typing", { planId });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    const ok = await onSend(text);
    setSending(false);
    if (ok) {
      setText("");
    }
  }

  return (
    <div className="card plan-feed">
      <h3>Лента купийки</h3>
      <ul ref={listRef}>
        {messages.length === 0 && <li className="empty">Пока тихо</li>}
        {messages.map((m) => (
          <li key={m.id} className={m.type}>
            <div className="feed-meta">
              {m.type === "message" && <strong>{m.email}</strong>}
              <time>{formatTime(m.createdAt)}</time>
            </div>
            <p>{m.text}</p>
          </li>
        ))}
      </ul>
      {closed ? (
        <p className="feed-closed">
          Купийка закрыта – лента доступна только для чтения
        </p>
      ) : (
        <>
          <p className="typing">
            {typingEmail && `${typingEmail} печатает...`}
          </p>
          <form className="inline-form" onSubmit={handleSubmit}>
            <input
              placeholder="Сообщение участникам"
              value={text}
              onChange={handleChange}
            />
            <button type="submit" className="primary" disabled={sending}>
              Отправить
            </button>
          </form>
        </>
      )}
    </div>
  );
}
