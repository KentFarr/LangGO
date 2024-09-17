import React from 'react';
import styled from 'styled-components';

const FooterSection = styled.footer`
  background: linear-gradient(90deg, #495e57, #2d2f33);
  color: #f5f7f8;
  padding: 20px 0;
  text-align: center;
  position: relative;
  width: 100%;
  bottom: 0;
`;

const FooterLink = styled.a`
  color: #f5f7f8; /* Changed link color to match text but can distinguish with hover */
  font-weight: bold; /* Make links bold to stand out */
  margin: 0 10px;
  text-decoration: none;
  &:hover {
    color: #f4ce14; /* On hover, change to an accent color */
    text-decoration: underline;
  }
`;

const FooterWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const CreatorCredit = styled.p`
  margin: 10px 0;
  font-size: 0.9rem;
  color: #f5f7f8;
  text-align: center;
  opacity: 0.8; /* Lighten the text slightly for subtle emphasis */
`;

const Footer: React.FC = () => (
  <FooterSection>
    <FooterWrapper>
      <p>
        &copy; {new Date().getFullYear()} LangGo. All rights reserved.
      </p>
      <CreatorCredit>
        Created by
        <FooterLink href="https://kentfarabaugh.com">
        Kent Farabaugh
        </FooterLink>
      </CreatorCredit>
      <FooterLink href="/privacy">Privacy Policy</FooterLink>
    </FooterWrapper>
  </FooterSection>
);

export default Footer;
