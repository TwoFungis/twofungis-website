import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LocationPage from './pages/LocationPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/locations/:city" element={<LocationPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;