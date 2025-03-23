import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    // Remove any special characters that might be in the URL
    const sanitizedUsername = username.trim().replace(/[^\w-]/g, '');
    
    // Navigate to visualization page with the username
    navigate(`/visualization/${sanitizedUsername}`);
  };

  return (
    <div className="home-container">
      <div className="form-container">
        <h2>Enter your Letterboxd Username</h2>
        <p>
          Enter your Letterboxd username to generate visualizations of your 
          movie watching history.
        </p>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g., 'davidehrlich' or 'taste-police'"
            aria-label="Letterboxd username"
          />
          <button type="submit">Generate Visualization</button>
        </form>
        
        <div className="info-text">
          <p>
            This app is not affiliated with 
            <a href="https://letterboxd.com" target="_blank" rel="noopener noreferrer">
              Letterboxd
            </a>. 
            It creates visualizations based on publicly available diary entries.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home; 