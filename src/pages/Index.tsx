
import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import StatsSection from '@/components/StatsSection';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-zenalyst">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
