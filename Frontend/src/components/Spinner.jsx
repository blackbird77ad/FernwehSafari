export default function Spinner({ label = "Loading" }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}
