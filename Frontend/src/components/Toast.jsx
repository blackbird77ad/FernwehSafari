export default function Toast({ message, tone = "success", onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`toast ${tone}`} role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
