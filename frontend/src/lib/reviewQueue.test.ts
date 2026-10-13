import { describe, expect, it } from 'vitest';
import { currentCardId, isFinished, reviewReducer, startSession, summarize } from './reviewQueue';

describe('review session', () => {
  it('walks through the queue, recording grades', () => {
    let session = startSession(['a', 'b']);
    expect(currentCardId(session)).toBe('a');

    session = reviewReducer(session, { type: 'flip' });
    expect(session.flipped).toBe(true);

    session = reviewReducer(session, { type: 'graded', id: 'a', remembered: true });
    expect(currentCardId(session)).toBe('b');
    expect(session.flipped).toBe(false);

    session = reviewReducer(session, { type: 'graded', id: 'b', remembered: false });
    expect(isFinished(session)).toBe(true);
    expect(summarize(session)).toEqual({ reviewed: 2, remembered: 1, forgot: 1 });
  });

  it('ignores grades for a card that is no longer current', () => {
    let session = startSession(['a', 'b']);
    session = reviewReducer(session, { type: 'graded', id: 'a', remembered: true });
    const again = reviewReducer(session, { type: 'graded', id: 'a', remembered: false });
    expect(again).toBe(session);
  });

  it('does nothing once finished', () => {
    const finished = reviewReducer(startSession(['a']), { type: 'graded', id: 'a', remembered: true });
    expect(reviewReducer(finished, { type: 'flip' })).toBe(finished);
  });

  it('copies the queue so later changes to the deck do not affect it', () => {
    const ids = ['a'];
    const session = startSession(ids);
    ids.push('b');
    expect(session.queue).toEqual(['a']);
  });
});
