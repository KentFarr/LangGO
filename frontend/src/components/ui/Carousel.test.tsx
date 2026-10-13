import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Carousel } from './Carousel';

describe('Carousel', () => {
  it('moves between slides and wraps around', async () => {
    render(<Carousel label="Samples" slides={[<p key="1">one</p>, <p key="2">two</p>, <p key="3">three</p>]} />);
    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('three')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '3 of 3' })).toBeInTheDocument();
  });
});
