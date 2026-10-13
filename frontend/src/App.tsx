import { lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import PublicLayout from './components/layout/PublicLayout';
import FlashcardsProvider from './flashcards/FlashcardsProvider';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Privacy from './pages/Privacy';
import SignUp from './pages/SignUp';

// Signed-in pages pull in the word lists and the PDF reader, so they load on demand.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Review = lazy(() => import('./pages/Review'));
const Create = lazy(() => import('./pages/Create'));
const Library = lazy(() => import('./pages/Library'));

/** Start each page at the top, except in-page anchor links. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function SignedInArea() {
  return (
    <ProtectedRoute>
      <FlashcardsProvider>
        <AppShell />
      </FlashcardsProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignUp />} />

        <Route element={<SignedInArea />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="review" element={<Review />} />
          <Route path="create" element={<Create />} />
          <Route path="library" element={<Library />} />
        </Route>

        {/* Old URL kept working for existing bookmarks. */}
        <Route path="userdashboard" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
