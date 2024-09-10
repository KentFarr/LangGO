import React from 'react';
import NavBar from '../components/NavBar';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReact, faNodeJs, faGoogle, faBootstrap } from '@fortawesome/free-brands-svg-icons';
import { faFileUpload, faBrain, faChartLine, faBolt } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

// Gradient Styled Components

const GradientHeroSection = styled.section`
    background: linear-gradient(90deg, #495E57, #F4CE14);
    color: white;
    padding: 100px 0;
    text-align: center;
`;

const GradientTechnologiesSection = styled.section`
    background: linear-gradient(135deg, #f0f4f8, #ffffff);
    padding: 80px 0;
`;

const GradientHowItWorksSection = styled.section`
    background: linear-gradient(135deg, #ffffff, #f0f4f8);
    padding: 80px 0;
`;

const FooterSection = styled.footer`
    background: linear-gradient(90deg, #495E57, #2d2f33);
    color: #F5F7F8;
    padding: 20px 0;
    text-align: center;
`;

// Hero Section
const HeroSection = () => (
    <GradientHeroSection>
        <Container>
            <h1 className="mb-4">Master Japanese Vocabulary with Ease</h1>
            <p className="lead mb-4">
                Upload your Japanese PDF, and let our app help you find and learn the most important words based on your proficiency level.
            </p>
            <Button variant="light" href="/signup" size="lg">
                Get Started
            </Button>
        </Container>
    </GradientHeroSection>
);

// Technologies Section
const TechnologiesSection = () => (
    <GradientTechnologiesSection>
        <Container>
            <h2 className="text-center mb-5">Powered by Cutting-Edge Technologies</h2>
            <Row className="gy-4">
                <Col md={3} className="text-center">
                    <FontAwesomeIcon icon={faReact} size="3x" className="mb-3" />
                    <h4>React</h4>
                    <p>Our frontend is built with React, ensuring a fast and responsive user experience.</p>
                </Col>
                <Col md={3} className="text-center">
                    <FontAwesomeIcon icon={faNodeJs} size="3x" className="mb-3" />
                    <h4>Node.js</h4>
                    <p>Node.js powers our backend, handling file processing and communication with Firebase.</p>
                </Col>
                <Col md={3} className="text-center">
                    <FontAwesomeIcon icon={faGoogle} size="3x" className="mb-3" />
                    <h4>Firebase</h4>
                    <p>Flashcards are securely stored in Firebase, so you can access them anytime through your user dashboard.</p>
                </Col>
                <Col md={3} className="text-center">
                    <FontAwesomeIcon icon={faBootstrap} size="3x" className="mb-3" />
                    <h4>Bootstrap</h4>
                    <p>We use Bootstrap to provide a clean, responsive design that works well on any device.</p>
                </Col>
            </Row>
        </Container>
    </GradientTechnologiesSection>
);

// How It Works Section
const HowItWorksSection = () => (
    <GradientHowItWorksSection>
        <Container>
            <h2 className="text-center mb-5">How It Works</h2>
            <Row className="gy-4">
                <Col md={6} className="text-center">
                    <FontAwesomeIcon icon={faFileUpload} size="3x" className="mb-3" />
                    <h4>1. Upload a Japanese PDF</h4>
                    <p>Upload a Japanese PDF file, and we’ll extract the top words based on your chosen JLPT level (N1-N5).</p>
                </Col>
                <Col md={6} className="text-center">
                    <FontAwesomeIcon icon={faBolt} size="3x" className="mb-3" />
                    <h4>2. Generate Flashcards</h4>
                    <p>We generate flashcards for with your top words and store them in Firebase for future reference.</p>
                </Col>
                <Col md={6} className="text-center">
                    <FontAwesomeIcon icon={faBrain} size="3x" className="mb-3" />
                    <h4>3. Get AI Suggestions</h4>
                    <p>Using OpenAI, we suggest 5 additional words related to your text, giving you more vocabulary to explore.</p>
                </Col>
                <Col md={6} className="text-center">
                    <FontAwesomeIcon icon={faChartLine} size="3x" className="mb-3" />
                    <h4>4. Access Your Dashboard</h4>
                    <p>All flashcards are stored in your user dashboard. And have Access to our spaced repetition system to help reinforce your learning!</p>
                </Col>
            </Row>
        </Container>
    </GradientHowItWorksSection>
);

// CTA Section
const CTASection = () => (
    <Container className="text-center py-5 my-5">
        <h2 className="mb-4">Ready to Boost Your Japanese?</h2>
        <p className="lead mb-4">
            Sign up now and start learning Japanese vocabulary more effectively with personalized flashcards.
        </p>
        <Button variant="success" href="/signup" size="lg">
            Sign Up
        </Button>
    </Container>
);

// Footer Section
const Footer = () => (
    <FooterSection>
        <p>&copy; {new Date().getFullYear()} LangGo. All rights reserved.</p>
        <a href="/privacy" className="text-light">Privacy Policy</a>
    </FooterSection>
);

// Home Page
const Home: React.FC = () => {
    return (
        <div className='container-fluid p-0'>
            <NavBar brand="LangGo" links={[{ name: 'Sign Up', href: '/signup' }, { name: 'Log In', href: '/login' }]} />

            {/* Hero Section */}
            <HeroSection />

            {/* Technologies Section */}
            <TechnologiesSection />

            {/* How It Works Section */}
            <HowItWorksSection />

            {/* Call to Action Section */}
            <CTASection />

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Home;
