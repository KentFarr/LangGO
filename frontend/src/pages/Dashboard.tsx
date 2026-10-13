import { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { FaCircleCheck } from 'react-icons/fa6';
import styled from 'styled-components';
import { useRequiredUser } from '../auth/useAuth';
import FlashcardGenerator from '../components/FlashcardGenerator';
import FlashcardLibrary from '../components/FlashcardLibrary';
import LoadingSpinner from '../components/LoadingSpinner';
import ReviewSection from '../components/ReviewSection';
import { useFlashcards } from '../hooks/useFlashcards';
import { fetchMeta, type AppMeta } from '../lib/api';
import { colors } from '../theme';

const Panel = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 3rem auto;
  padding: 2.5rem;
  border-radius: 15px;
  background-color: ${colors.surface};
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);

  @media (max-width: 576px) {
    margin: 1rem auto;
    padding: 1.25rem;
  }
`;

const Divider = styled.hr`
  margin: 3rem 0;
`;

export default function Dashboard() {
  const user = useRequiredUser();
  const { cards, status, review, remove, addCards } = useFlashcards();
  const [meta, setMeta] = useState<AppMeta | null>(null);

  useEffect(() => {
    fetchMeta().then(setMeta, (error: unknown) => console.error('Failed to load app info', error));
  }, []);

  return (
    <div className="px-3">
      <Panel>
        <h1 className="text-center mb-2">Dashboard</h1>
        <p className="text-center mb-5" style={{ color: colors.primary }}>
          <FaCircleCheck aria-hidden className="me-2" />
          Signed in as {user.name} ({user.email})
        </p>

        {meta?.demoMode && (
          <Alert variant="info" className="text-center">
            <strong>Demo mode.</strong> This server has no OpenAI key, so it serves sample
            flashcards. Choose <em>Random words</em> to see complete cards for any level.
          </Alert>
        )}

        <FlashcardGenerator onGenerated={addCards} demoWords={meta?.sampleWords} />

        <Divider />

        {status === 'loading' && <LoadingSpinner label="Loading your flashcards…" />}
        {status === 'error' && (
          <Alert variant="danger" className="text-center">
            Could not load your flashcards. Please refresh the page to try again.
          </Alert>
        )}
        {status === 'ready' && (
          <>
            <ReviewSection cards={cards} onReview={review} />
            <Divider />
            <FlashcardLibrary cards={cards} onDelete={remove} />
          </>
        )}
      </Panel>
    </div>
  );
}
