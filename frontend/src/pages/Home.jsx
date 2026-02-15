import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import BuiltForBuilders from '../components/BuiltForBuilders';
import Capabilities from '../components/Capabilities';
import ComplianceTrust from '../components/ComplianceTrust';
import Portfolio from '../components/Portfolio';
import WhyBuildersChooseUs from '../components/WhyBuildersChooseUs';
import RegionalCoverage from '../components/RegionalCoverage';
import EstimatingCTA from '../components/EstimatingCTA';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <BuiltForBuilders />
      <Capabilities />
      <ComplianceTrust />
      <Portfolio />
      <WhyBuildersChooseUs />
      <RegionalCoverage />
      <EstimatingCTA />
      <Footer />
    </div>
  );
};

export default Home;
