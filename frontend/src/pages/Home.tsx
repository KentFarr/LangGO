import React from 'react';
import '../styles/Home.css';
import { Link } from 'react-router-dom';
const Home: React.FC = () => {
    return (
        <div className="home-container">
            <h1 className="home-title">Welcome to the Home Page</h1>
            <Link to="/signup">
                <button className='home-button'>Sign Up</button>
            </Link>
            <Link to="/login">
                <button className="home-button">Log In</button>
            </Link>
        </div>

    );
};

export default Home;