import { useState, type KeyboardEvent, type ReactNode } from 'react';
import styled from 'styled-components';
import { colors } from '../theme';

const Scene = styled.div`
  perspective: 1000px;
  width: 100%;
  height: 300px;
`;

const Inner = styled.div<{ $flipped: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 15px;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  transform: ${({ $flipped }) => ($flipped ? 'rotateY(180deg)' : 'none')};

  &:focus-visible {
    outline: 3px solid ${colors.accent};
    outline-offset: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Face = styled.div<{ $back?: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: safe center;
  gap: 0.5rem;
  padding: 20px;
  overflow-y: auto;
  border-radius: 15px;
  text-align: center;
  backface-visibility: hidden;
  background-color: ${({ $back }) => ($back ? colors.surfaceMuted : colors.surface)};
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  ${({ $back }) => $back && 'transform: rotateY(180deg);'}
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Accessible name for the card, e.g. the word on its front. */
  label: string;
  /** Rendered below the card; receives whether the back is currently showing. */
  actions?: (flipped: boolean) => ReactNode;
}

export default function FlipCard({ front, back, label, actions }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const toggle = () => setFlipped((value) => !value);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <div className="w-100">
      <Scene>
        <Inner
          $flipped={flipped}
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={`${label}: ${flipped ? 'showing answer' : 'showing word'}. Activate to flip.`}
          onClick={toggle}
          onKeyDown={handleKeyDown}
        >
          <Face aria-hidden={flipped}>{front}</Face>
          <Face $back aria-hidden={!flipped}>
            {back}
          </Face>
        </Inner>
      </Scene>
      {actions && <Actions>{actions(flipped)}</Actions>}
    </div>
  );
}
