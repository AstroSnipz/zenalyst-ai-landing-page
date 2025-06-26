
import React from 'react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">
            Zenalyst
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-white hover:text-purple-300 hover:bg-white/10">
              Login
            </Button>
            <Button className="bg-purple text-white hover:bg-purple/90 transition-all duration-300 hover:scale-105">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
