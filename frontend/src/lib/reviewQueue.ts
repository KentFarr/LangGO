/** State of one review session. The queue is fixed when the session starts. */
export interface ReviewSession {
  queue: readonly string[];
  index: number;
  flipped: boolean;
  /** Card id → whether it was remembered. */
  results: Readonly<Record<string, boolean>>;
}

export type ReviewAction = { type: 'flip' } | { type: 'graded'; id: string; remembered: boolean };

export function startSession(cardIds: readonly string[]): ReviewSession {
  return { queue: [...cardIds], index: 0, flipped: false, results: {} };
}

export function currentCardId(session: ReviewSession): string | undefined {
  return session.queue[session.index];
}

export function isFinished(session: ReviewSession): boolean {
  return session.index >= session.queue.length;
}

export function reviewReducer(session: ReviewSession, action: ReviewAction): ReviewSession {
  if (isFinished(session)) return session;
  switch (action.type) {
    case 'flip':
      return { ...session, flipped: !session.flipped };
    case 'graded':
      // Ignore stale grades (e.g. a double key press) for a card that's no longer current.
      if (action.id !== currentCardId(session)) return session;
      return {
        ...session,
        index: session.index + 1,
        flipped: false,
        results: { ...session.results, [action.id]: action.remembered },
      };
  }
}

export function summarize(session: ReviewSession) {
  const grades = Object.values(session.results);
  const remembered = grades.filter(Boolean).length;
  return { reviewed: grades.length, remembered, forgot: grades.length - remembered };
}
