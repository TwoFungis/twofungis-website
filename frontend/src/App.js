import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import LocationPage from './pages/LocationPage';
import './App.css';

// Scroll to top on route change, or to hash if present
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  
  useEffect(() => {
    // If there's a hash, scroll to that element
    if (hash) {
      // Small delay to ensure the page has loaded
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // No hash, scroll to top
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  
  return null;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/locations/:city" element={<LocationPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;