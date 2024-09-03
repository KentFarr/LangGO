import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
const Home: React.FC = () => {
    return (
        <div className='container'>
            <div className='row'>
                <h1 className="text-center display-1">Thanks for checking out LangGo</h1>
                <h2 className="text-center">The best way to learn a new language</h2>
            </div>
            <NavBar brand="LangGo" links={[{ name: 'Home', href: '/' }, { name: 'Sign Up', href: '/signup' }, { name: 'Log In', href: '/login' }]} />
        </div>

    );
};

export default Home;