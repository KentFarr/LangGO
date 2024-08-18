import React from 'react';
import { Link } from 'react-router-dom';
const Home: React.FC = () => {
    return (
        <div>
            <h1>Welcome to the Home Page</h1>
            <Link to="/signup">Sign Up</Link>

            <Link to="/upload">Upload</Link>
            
        </div>
    );
};

export default Home;