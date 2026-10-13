import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import FlipCard from './FlipCard';

function renderCard() {
  render(
    <FlipCard
      label="勉強"
      front={<span>front side</span>}
      back={<span>back side</span>}
      actions={(flipped) => <button disabled={!flipped}>Rate</button>}
    />,
  );
  return screen.getByRole('button', { name: /勉強/ });
}

describe('FlipCard', () => {
  it('flips when clicked', async () => {
    const card = renderCard();
    expect(card).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Rate' })).toBeDisabled();

    await userEvent.click(card);

    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Rate' })).toBeEnabled();
  });

  it('flips with the keyboard', async () => {
    const card = renderCard();
    card.focus();

    await userEvent.keyboard('{Enter}');
    expect(card).toHaveAttribute('aria-pressed', 'true');

    await userEvent.keyboard(' ');
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });
});
