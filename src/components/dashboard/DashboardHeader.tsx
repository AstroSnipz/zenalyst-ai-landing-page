
import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSidebar } from '@/components/ui/sidebar';

interface Profile {
  company_name?: string;
}

const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchNotificationCount();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('company_name')
      .eq('id', user.id)
      .single();
    
    setProfile(data);
  };

  const fetchNotificationCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    
    setNotificationCount(count || 0);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-zenalyst bg-clip-text text-transparent">
              Welcome back, {profile?.company_name || 'User'}
            </h1>
            <p className="text-gray-600 font-medium">Here's what's happening with your business today.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-600" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-red-600"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white shadow-xl border border-gray-200">
              <DropdownMenuItem onClick={handleLogout} className="hover:bg-gray-50 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4 text-gray-600" />
                <span className="text-gray-700">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
