import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Capabilities from '../components/Capabilities';
import Portfolio from '../components/Portfolio';
import WhyBuildersChooseUs from '../components/WhyBuildersChooseUs';
import RegionalCoverage from '../components/RegionalCoverage';
import PartnerWithUs from '../components/PartnerWithUs';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Capabilities />
      <Portfolio />
      <WhyBuildersChooseUs />
      <RegionalCoverage />
      <PartnerWithUs />
      <Footer />
    </div>
  );
};

export default Home;
