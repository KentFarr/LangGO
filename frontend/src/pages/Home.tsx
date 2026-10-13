import type { IconType } from 'react-icons';
import { Col, Container, Row } from 'react-bootstrap';
import {
  FaBolt,
  FaBootstrap,
  FaDatabase,
  FaBrain,
  FaChartLine,
  FaFileArrowUp,
  FaNodeJs,
  FaReact,
} from 'react-icons/fa6';
import { Link } from 'react-router';
import styled from 'styled-components';
import { useAuth } from '../auth/useAuth';
import { colors } from '../theme';

const Hero = styled.section`
  padding: 100px 0;
  background: linear-gradient(90deg, ${colors.primary}, ${colors.accent});
  color: white;
  text-align: center;
`;

const Band = styled.section<{ $reverse?: boolean }>`
  padding: 80px 0;
  background: linear-gradient(
    135deg,
    ${({ $reverse }) => ($reverse ? '#ffffff, #f0f4f8' : '#f0f4f8, #ffffff')}
  );
`;

interface Feature {
  icon: IconType;
  title: string;
  description: string;
}

const TECHNOLOGIES: Feature[] = [
  {
    icon: FaReact,
    title: 'React + TypeScript',
    description: 'A fast, type-safe single-page app built with React and Vite.',
  },
  {
    icon: FaNodeJs,
    title: 'Node.js + Express',
    description: 'A TypeScript API with secure cookie sessions powered by Better Auth.',
  },
  {
    icon: FaDatabase,
    title: 'PostgreSQL',
    description: 'Your flashcards and review history, stored with Drizzle ORM.',
  },
  {
    icon: FaBootstrap,
    title: 'Bootstrap',
    description: 'A clean, responsive design that works well on any device.',
  },
];

const STEPS: Feature[] = [
  {
    icon: FaFileArrowUp,
    title: '1. Upload a Japanese PDF',
    description:
      'Pick a JLPT level (N5–N1) and we find the most frequent words from that level in your PDF. ' +
      'The file is read in your browser and never uploaded.',
  },
  {
    icon: FaBolt,
    title: '2. Generate flashcards',
    description:
      'Each word gets a flashcard with its reading, meaning, and a memorable mnemonic.',
  },
  {
    icon: FaBrain,
    title: '3. Discover related words',
    description: 'AI suggests five more words related to your text to grow your vocabulary.',
  },
  {
    icon: FaChartLine,
    title: '4. Review with spaced repetition',
    description:
      'Cards come back for review just as you are about to forget them, so learning sticks.',
  },
];

function FeatureGrid({ features, columns }: { features: Feature[]; columns: number }) {
  return (
    <Row className="gy-4">
      {features.map(({ icon: Icon, title, description }) => (
        <Col key={title} md={12 / columns} className="text-center">
          <Icon size={48} className="mb-3" aria-hidden color={colors.primary} />
          <h3 className="h4">{title}</h3>
          <p>{description}</p>
        </Col>
      ))}
    </Row>
  );
}

export default function Home() {
  const { user } = useAuth();
  const signedIn = Boolean(user);
  const cta = signedIn
    ? { to: '/dashboard', label: 'Go to your dashboard' }
    : { to: '/signup', label: 'Get started' };

  return (
    <>
      <Hero>
        <Container>
          <h1 className="mb-4">Master Japanese vocabulary with ease</h1>
          <p className="lead mb-4">
            Upload a Japanese PDF and learn its most important words for your JLPT level, with
            AI-generated mnemonics and spaced repetition.
          </p>
          <Link to={cta.to} className="btn btn-light btn-lg">
            {cta.label}
          </Link>
        </Container>
      </Hero>

      <Band>
        <Container>
          <h2 className="text-center mb-5">How it works</h2>
          <FeatureGrid features={STEPS} columns={2} />
        </Container>
      </Band>

      <Band $reverse>
        <Container>
          <h2 className="text-center mb-5">Built with</h2>
          <FeatureGrid features={TECHNOLOGIES} columns={4} />
        </Container>
      </Band>

      {!signedIn && (
        <Container className="text-center py-5 my-5">
          <h2 className="mb-4">Ready to boost your Japanese?</h2>
          <p className="lead mb-4">
            Sign up for free and start building personalized flashcards today.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Sign up
          </Link>
        </Container>
      )}
    </>
  );
}
