import { Spinner } from 'react-bootstrap';

export default function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="d-flex justify-content-center align-items-center gap-2 py-5" role="status">
      <Spinner animation="border" size="sm" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
