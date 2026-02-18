import React, { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import Portfolio from '../components/Portfolio';
import ServiceAreas from '../components/ServiceAreas';
import WhyChooseUs from '../components/WhyChooseUs';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import TradeOSBanner from '../components/TradeOSBanner';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <TradeOSBanner />
      <Header />
      <Hero />
      <About />
      <Services />
      <Portfolio />
      <ServiceAreas />
      <WhyChooseUs />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;