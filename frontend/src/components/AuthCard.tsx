import type { ReactNode } from 'react';
import styled from 'styled-components';
import { colors } from '../theme';

const Backdrop = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.text});
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  border-radius: 10px;
  background-color: ${colors.surface};
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  h1 {
    margin-bottom: 1.5rem;
    font-size: 1.75rem;
    font-weight: 700;
    text-align: center;
  }
`;

/** Centered card used by the log-in and sign-up pages. */
export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Backdrop>
      <Card>
        <h1>{title}</h1>
        {children}
      </Card>
    </Backdrop>
  );
}
