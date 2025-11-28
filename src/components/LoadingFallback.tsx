export function LoadingFallback() {
  return (
    <div className="screen">
      <div className="waiting-animation">
        <div className="spinner"></div>
      </div>
      <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: '1rem' }}>
        Loading...
      </p>
    </div>
  );
}
