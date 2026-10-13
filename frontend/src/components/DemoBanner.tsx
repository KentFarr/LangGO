import { Alert } from './ui/Feedback';

/** Shown when the server has no OpenAI key and serves sample cards. */
export default function DemoBanner({ onCreatePage = false }: { onCreatePage?: boolean }) {
  return (
    <Alert className="mb-8">
      <strong className="font-medium">Demo mode.</strong> This server has no OpenAI key, so it serves sample flashcards.{' '}
      {onCreatePage
        ? 'Choose Random words to see complete cards for any level.'
        : 'Choose Random words on the Create page to see complete cards for any level.'}
    </Alert>
  );
}
