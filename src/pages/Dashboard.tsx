
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-zenalyst">
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">
              Zenalyst Dashboard
            </div>
            <Button 
              variant="ghost" 
              className="text-white hover:text-purple-300 hover:bg-white/10"
              onClick={() => navigate('/')}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Welcome to Your Dashboard
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            This is where you'll manage your due diligence projects and view reports.
          </p>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-300">
              Dashboard features are under development. You'll soon be able to:
            </p>
            <ul className="text-left text-gray-300 mt-4 space-y-2">
              <li>• Upload documents for analysis</li>
              <li>• View due diligence reports</li>
              <li>• Track project progress</li>
              <li>• Manage team access</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
