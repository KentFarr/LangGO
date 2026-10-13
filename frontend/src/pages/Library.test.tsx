import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { FlashcardsContext } from '../flashcards/context';
import * as api from '../lib/api';
import { filterCards } from '../lib/filters';
import { card, deckState } from '../test/fixtures';
import Library from './Library';

vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  exportFlashcards: vi.fn(async () => {}),
}));

const cards = [
  card('a', { word: '学校', reading: 'がっこう', meaning: 'school', level: 5 }),
  card('b', { word: '環境', reading: 'かんきょう', meaning: 'environment', level: 3, source: 'related' }),
  card('c', { word: '把握', reading: 'はあく', meaning: 'grasp', level: null }),
];

describe('filterCards', () => {
  const all = { query: '', level: 'all', source: 'all' } as const;

  it('filters by level and source', () => {
    expect(filterCards(cards, { ...all, level: 3 }).map((c) => c.id)).toEqual(['b']);
    expect(filterCards(cards, { ...all, source: 'requested' }).map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('searches word, reading and meaning, case-insensitively', () => {
    expect(filterCards(cards, { ...all, query: 'SCHOOL' }).map((c) => c.id)).toEqual(['a']);
    expect(filterCards(cards, { ...all, query: 'はあ' }).map((c) => c.id)).toEqual(['c']);
    expect(filterCards(cards, { ...all, query: '環' }).map((c) => c.id)).toEqual(['b']);
  });
});

describe('Library page', () => {
  function renderLibrary(state = deckState({ cards })) {
    render(
      <FlashcardsContext value={state}>
        <MemoryRouter>
          <Library />
        </MemoryRouter>
      </FlashcardsContext>,
    );
    return state;
  }

  it('filters the grid with the level chips and search box', async () => {
    renderLibrary();
    expect(screen.getByText('Showing 3 of 3 cards')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'N3' }));
    expect(screen.getByText('Showing 1 of 3 cards')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'All levels' }));
    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'zzz');
    expect(screen.getByText(/no cards match/i)).toBeInTheDocument();
  });

  it('deletes a card after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const state = renderLibrary();

    await userEvent.click(screen.getByRole('button', { name: 'Delete 学校' }));
    expect(state.remove).toHaveBeenCalledWith(cards[0]);
  });

  it('exports the whole deck, or just the filtered cards', async () => {
    renderLibrary();
    await userEvent.click(screen.getByRole('button', { name: /anki deck/i }));
    expect(api.exportFlashcards).toHaveBeenLastCalledWith('apkg', undefined);

    await userEvent.click(screen.getByRole('radio', { name: 'N3' }));
    expect(screen.getByText('Export 1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'CSV' }));
    expect(api.exportFlashcards).toHaveBeenLastCalledWith('csv', ['b']);
  });

  it('shows export errors', async () => {
    vi.mocked(api.exportFlashcards).mockRejectedValueOnce(new api.ApiError('There are no flashcards to export.', 400));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderLibrary();
    await userEvent.click(screen.getByRole('button', { name: /anki deck/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('There are no flashcards to export.');
  });

  it('shows an empty state with no cards', () => {
    renderLibrary(deckState({ cards: [] }));
    expect(screen.getByRole('heading', { name: /library is empty/i })).toBeInTheDocument();
  });
});
