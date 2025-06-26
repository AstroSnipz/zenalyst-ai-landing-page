
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 px-6 text-center">
      <div className="container mx-auto max-w-6xl">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            AI-Powered Due Diligence
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              in 5 Days
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Automate financial verification, detect risks, and generate investor-ready reports
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple to-blue-600 hover:from-purple/90 hover:to-blue-600/90 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            Start Free Trial
          </Button>
        </div>
        <div className="mt-16 animate-float">
          <ArrowDown className="mx-auto text-white/60 w-8 h-8" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
