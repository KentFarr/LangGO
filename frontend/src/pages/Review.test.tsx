import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { FlashcardsContext, type FlashcardsState } from '../flashcards/context';
import { card, deckState } from '../test/fixtures';
import Review from './Review';

function renderReview(state: FlashcardsState) {
  render(
    <FlashcardsContext value={state}>
      <MemoryRouter>
        <Review />
      </MemoryRouter>
    </FlashcardsContext>,
  );
}

const flipCard = () => screen.getByRole('button', { name: /activate to flip/i });

describe('Review session', () => {
  it('flips and grades cards with the keyboard, then shows a summary', async () => {
    const first = card('a', { nextReviewDate: '2020-01-01T00:00:00.000Z' });
    const second = card('b', { nextReviewDate: '2020-01-02T00:00:00.000Z' });
    const state = deckState({ cards: [second, first] });
    renderReview(state);

    // Oldest due card first; grading is ignored until the card is flipped.
    expect(flipCard()).toHaveAccessibleName(/word-a/);
    await userEvent.keyboard('2');
    expect(state.review).not.toHaveBeenCalled();

    await userEvent.keyboard(' ');
    expect(flipCard()).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('2');
    expect(state.review).toHaveBeenCalledWith(first, true);

    expect(await screen.findByRole('button', { name: /word-b/ })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.keyboard(' ');
    await userEvent.keyboard('1');
    expect(state.review).toHaveBeenLastCalledWith(second, false);

    expect(await screen.findByRole('heading', { name: /session complete/i })).toBeInTheDocument();
    expect(screen.getByText('Remembered').previousElementSibling).toHaveTextContent('1');
    expect(screen.getByText('Forgot').previousElementSibling).toHaveTextContent('1');
  });

  it('grades with the on-screen buttons too', async () => {
    const state = deckState({ cards: [card('a')] });
    renderReview(state);

    const remembered = screen.getByRole('button', { name: /remembered/i });
    expect(remembered).toBeDisabled();
    await userEvent.click(flipCard());
    await userEvent.click(remembered);

    expect(state.review).toHaveBeenCalledWith(state.cards[0], true);
  });

  it('shows an error and stays on the card when saving fails', async () => {
    const state = deckState({
      cards: [card('a')],
      review: async () => {
        throw new Error('offline');
      },
    });
    const consoleError = console.error;
    console.error = () => {};
    renderReview(state);

    await userEvent.keyboard(' ');
    await userEvent.keyboard('2');

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not save/i);
    expect(flipCard()).toHaveAccessibleName(/word-a/);
    console.error = consoleError;
  });

  it('says when nothing is due', () => {
    renderReview(deckState({ cards: [card('a', { nextReviewDate: '2999-01-01T00:00:00.000Z' })] }));
    expect(screen.getByRole('heading', { name: /all caught up/i })).toBeInTheDocument();
  });
});
