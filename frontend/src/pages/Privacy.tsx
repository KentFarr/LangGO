import { Container } from 'react-bootstrap';
import styled from 'styled-components';
import { colors } from '../theme';

const Article = styled.article`
  max-width: 800px;
  line-height: 1.6;

  h1 {
    margin-bottom: 2rem;
    color: ${colors.primary};
    text-align: center;
  }

  h2 {
    margin-top: 2rem;
    font-size: 1.25rem;
    color: ${colors.primary};
  }

  a {
    color: ${colors.primary};
    font-weight: 600;
  }
`;

export default function Privacy() {
  return (
    <Container className="py-5">
      <Article className="mx-auto">
        <h1>Privacy Policy</h1>

        <p>
          Your privacy is important to us. This policy explains what information LangGo (
          <a href="https://langgo.co">langgo.co</a>) collects and how it is used.
        </p>

        <h2>What we collect</h2>
        <p>
          To create an account we store your name, email address, and a securely hashed
          password; we never store your password in plain text. The flashcards you generate,
          along with your review progress, are stored in our database so you can come back to
          them at any time. A session cookie keeps you signed in.
        </p>

        <h2>How your documents are handled</h2>
        <p>
          PDFs you choose are read entirely in your browser and are never uploaded. Only the
          short list of vocabulary words selected from the PDF is sent to our server, which
          forwards those words to OpenAI to generate mnemonics.
        </p>

        <h2>Sharing</h2>
        <p>
          We do not sell your information or share personally identifying information with
          third parties, except for OpenAI as described above, or when required by law.
        </p>

        <h2>Retention</h2>
        <p>
          We keep your data only as long as your account is active. You can delete individual
          flashcards from your dashboard at any time, and you can contact us to have your
          account and all of its data removed.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or feedback are always welcome. Reach me at{' '}
          <a href="mailto:kentfarabaugh@gmail.com">kentfarabaugh@gmail.com</a>, and if you enjoy
          LangGo, check out my other projects on{' '}
          <a href="https://github.com/KentFarr" target="_blank" rel="noreferrer">
            GitHub
          </a>
          . Thank you for using LangGo!
        </p>

        <p className="text-muted mt-5 mb-0">Last updated: October 2026</p>
      </Article>
    </Container>
  );
}
