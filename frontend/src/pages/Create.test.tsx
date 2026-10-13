import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlashcardsContext } from '../flashcards/context';
import * as api from '../lib/api';
import { card, deckState } from '../test/fixtures';
import Create from './Create';

vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  extractUrl: vi.fn(),
  generateFlashcards: vi.fn(),
}));

function renderCreate() {
  const state = deckState();
  render(
    <FlashcardsContext value={state}>
      <MemoryRouter>
        <Create />
      </MemoryRouter>
    </FlashcardsContext>,
  );
  return state;
}

const chips = () => within(screen.getByRole('list', { name: /words to turn into flashcards/i }));

beforeEach(() => {
  vi.mocked(api.generateFlashcards).mockImplementation(async (words) => words.map((w) => card(w, { word: w })));
});

describe('Create page', () => {
  it('turns a pasted word list into level-grouped batches after review', async () => {
    const state = renderCreate();
    await userEvent.click(screen.getByRole('radio', { name: 'Word list' }));
    await userEvent.type(screen.getByLabelText(/your words/i), '学校、環境 ラーメン (ramen)');
    await userEvent.click(screen.getByRole('button', { name: /find words/i }));

    // Each word is shown with its detected level; words not on any list get "—".
    await screen.findByRole('list', { name: /words to turn into flashcards/i });
    expect(chips().getByText('学校')).toBeInTheDocument();
    expect(chips().getByTitle('JLPT N5')).toBeInTheDocument();
    expect(chips().getByTitle('JLPT N3')).toBeInTheDocument();
    expect(chips().getByTitle('Level not recorded')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove ラーメン' }));
    await userEvent.click(screen.getByRole('button', { name: /generate 2 flashcards/i }));

    expect(api.generateFlashcards).toHaveBeenNthCalledWith(1, ['学校'], 5);
    expect(api.generateFlashcards).toHaveBeenNthCalledWith(2, ['環境'], 3);
    expect(state.addCards).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/saved to your library/i)).toBeInTheDocument();
  });

  it('finds the most frequent words on a web page', async () => {
    vi.mocked(api.extractUrl).mockResolvedValue({
      url: 'https://example.com/news',
      title: '学校のニュース',
      text: '学校で先生と話しました。学校は楽しい。学校の天気。',
    });
    renderCreate();
    await userEvent.click(screen.getByRole('radio', { name: 'Website' }));
    await userEvent.type(screen.getByLabelText(/web page address/i), 'https://example.com/news');
    await userEvent.click(screen.getByRole('button', { name: /find words/i }));

    expect(api.extractUrl).toHaveBeenCalledWith('https://example.com/news');
    expect(await screen.findByText(/most frequent N5 words in “学校のニュース”/)).toBeInTheDocument();
    const school = chips().getByText('学校').closest('li')!;
    expect(within(school).getByText('×3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /generate \d+ flashcards/i }));
    expect(api.generateFlashcards).toHaveBeenCalledWith(expect.arrayContaining(['学校', '先生', '天気']), 5);
  });

  it('shows the server message when a page is blocked or unreachable', async () => {
    vi.mocked(api.extractUrl).mockRejectedValue(new api.ApiError("That address can't be fetched.", 400));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCreate();
    await userEvent.click(screen.getByRole('radio', { name: 'Website' }));
    await userEvent.type(screen.getByLabelText(/web page address/i), 'http://10.0.0.1/');
    await userEvent.click(screen.getByRole('button', { name: /find words/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent("That address can't be fetched.");
  });

  it('keeps cards from successful batches when a later batch fails', async () => {
    vi.mocked(api.generateFlashcards)
      .mockImplementationOnce(async (words) => words.map((w) => card(w, { word: w })))
      .mockRejectedValueOnce(new api.ApiError('Too many flashcard requests. Please try again later.', 429));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCreate();
    await userEvent.click(screen.getByRole('radio', { name: 'Word list' }));
    await userEvent.type(screen.getByLabelText(/your words/i), '学校 環境');
    await userEvent.click(screen.getByRole('button', { name: /find words/i }));
    await userEvent.click(await screen.findByRole('button', { name: /generate 2 flashcards/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Created 1 cards, but the rest failed: Too many flashcard requests.',
    );
  });
});
