import { Container } from 'react-bootstrap';
import { Link } from 'react-router';

export default function NotFound() {
  return (
    <Container className="text-center py-5 my-5">
      <h1 className="mb-3">Page not found</h1>
      <p className="lead mb-4">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </Container>
  );
}
