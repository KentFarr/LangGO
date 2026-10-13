import { Suspense } from 'react';
import { Outlet } from 'react-router';
import Footer from './Footer';
import LoadingSpinner from './LoadingSpinner';
import NavBar from './NavBar';

export default function Layout() {
  return (
    <>
      <NavBar />
      <main className="d-flex flex-column flex-grow-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
