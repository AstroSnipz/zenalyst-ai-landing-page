
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-zenalyst flex items-center justify-center px-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Sign in to your Zenalyst account</p>
        </div>
        
        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your password"
            />
          </div>
          
          <Button className="w-full bg-gradient-to-r from-purple to-blue-600 hover:from-purple/90 hover:to-blue-600/90 text-white py-3 text-lg font-semibold">
            Sign In
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-300">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Sign up
            </button>
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
