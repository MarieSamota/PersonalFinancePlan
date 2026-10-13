export function ErrorMessage({ error, onRetry }) {
  return (
    <div className="error-message">
      <p>Ошибка: {error}</p>
      <button onClick={onRetry}>Повторить</button>
    </div>
  );
}
