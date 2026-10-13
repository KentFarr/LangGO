import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import { colors } from '../theme';

const FooterSection = styled.footer`
  padding: 20px 0;
  background: linear-gradient(90deg, ${colors.primary}, #2d2f33);
  color: ${colors.background};
  text-align: center;

  p {
    margin: 0.5rem 0;
  }
`;

const linkStyle = css`
  margin: 0 10px;
  color: ${colors.background};
  font-weight: bold;
  text-decoration: none;

  &:hover {
    color: ${colors.accent};
    text-decoration: underline;
  }
`;

const ExternalLink = styled.a`
  ${linkStyle}
`;

const InternalLink = styled(Link)`
  ${linkStyle}
`;

const Credit = styled.p`
  font-size: 0.9rem;
  opacity: 0.8;
`;

export default function Footer() {
  return (
    <FooterSection>
      <p>&copy; {new Date().getFullYear()} LangGo. All rights reserved.</p>
      <Credit>
        Created by
        <ExternalLink href="https://kentfarabaugh.com" target="_blank" rel="noreferrer">
          Kent Farabaugh
        </ExternalLink>
      </Credit>
      <InternalLink to="/privacy">Privacy Policy</InternalLink>
    </FooterSection>
  );
}
