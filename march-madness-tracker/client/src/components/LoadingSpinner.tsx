export default function LoadingSpinner() {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite" aria-label="Loading">
      <div className="spinner" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
