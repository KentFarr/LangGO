import React from 'react';
import { Link } from 'react-router-dom';
const Home: React.FC = () => {
    return (
        <div className='container'>
            <div className='row'>
                <h1 className="text-center display-1">Thanks for checking out LangGo</h1>
                <Link to="/signup">
                    <button className='btn btn-primary'>Sign Up</button>
                </Link>
                <Link to="/login">
                    <button className='btn btn-primary'>Log In</button>
                </Link>
            </div>
        </div>

    );
};

export default Home;