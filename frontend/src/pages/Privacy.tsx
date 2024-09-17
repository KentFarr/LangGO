import React from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import styled from 'styled-components';

const Section = styled.section`
  background-color: #f5f7f8;
  padding: 3rem;
  border-radius: 10px;
  text-align: left;
`;

const Title = styled.h1`
  color: #495e57;
  text-align: center;
  margin-bottom: 2rem;
`;

const Paragraph = styled.p`
  color: #45474b;
  line-height: 1.6;
  margin-bottom: 2rem; /* Increased margin for larger spacing */
`;

const Link = styled.a`
  color: #f4ce14;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const PrivacySection = () => (
  <Section className="container py-5">
    <Title>Privacy Policy</Title>
    <Paragraph>
      Your privacy is important to us. It is LangGo's policy to respect your privacy
      regarding any information we may collect from you across our website,{" "}
      <Link href="http://langgo.co">http://langgo.co</Link>, and other sites we own and
      operate.
    </Paragraph>
    <Paragraph>
      We only ask for personal information when we truly need it to provide a service
      to you. We collect it by fair and lawful means, with your knowledge and consent.
      We also let you know why we’re collecting it and how it will be used.
    </Paragraph>
    <Paragraph>
      We only retain collected information for as long as necessary to provide you
      with your requested service. What data we store, we'll protect within
      commercially acceptable means to prevent loss and theft, as well as
      unauthorised access, disclosure, copying, use or modification.
    </Paragraph>
    <Paragraph>
      We don't share any personally identifying information publicly or with
      third-parties, except when required to by law.
    </Paragraph>
    <Paragraph>
      Our website may link to external sites that are not operated by us. Please be
      aware that we have no control over the content and practices of these sites, and
      cannot accept responsibility or liability for their respective privacy policies.
    </Paragraph>
    <Paragraph>
      You are free to refuse our request for your personal information, with the
      understanding that we may be unable to provide you with some of your desired
      services.
    </Paragraph>
    <Paragraph>
      Your continued use of our website will be regarded as acceptance of our
      practices around privacy and personal information. If you have any questions
      about how we handle user data and personal information, feel free to contact us.
    </Paragraph>
    <Paragraph> 
        I hope you enjoy and get great use out of this site,
        It took me many hours to create and I hope you gain and learn a lot with it.
        Please feel free to reach out to me at <Link href="mailto:kentfarabaugh@gmail.com">my email </Link>
        and let me know what you think. Also if you would check out <Link href="https://github.com/KentFarr">my githud </Link>
        and give me a follow and a star if you like the website.
        one final thank you from me for using my app!
    </Paragraph>
    <Paragraph>
      This policy is effective as of {new Date().getFullYear()}.
    </Paragraph>
  </Section>
);

const Privacy: React.FC = () => {
  return (
    <div className='container-fluid p-0'>
      <NavBar brand="LangGo" links={[{ name: 'Sign Up', href: '/signup' }, { name: 'Log In', href: '/login' }]} />
      <PrivacySection />
      <Footer />
    </div>
  );
}

export default Privacy;
