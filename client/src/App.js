import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Visualization from './components/Visualization';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Letterboxd Diary Visualizer</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/visualization/:username" element={<Visualization />} />
          </Routes>
        </main>
        <footer>
          <p>Not affiliated with Letterboxd</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
