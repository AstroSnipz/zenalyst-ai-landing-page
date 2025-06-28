
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, TrendingUp, Users, ShoppingCart, FileText, Settings, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Upload', href: '/dashboard/upload', icon: Upload },
  { name: 'Revenue', href: '/dashboard/revenue', icon: TrendingUp },
  { name: 'Payroll', href: '/dashboard/payroll', icon: Users },
  { name: 'Purchase Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const DashboardSidebar = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className={cn(
      "bg-gradient-zenalyst text-white transition-all duration-300 flex flex-col shadow-xl",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-white">Zenalyst</span>
          )}
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30"
                      : "text-white/80 hover:bg-white/10 hover:text-white hover:backdrop-blur-sm"
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-white/20">
        <div className="text-center text-white/60 text-xs">
          {!isCollapsed && "Zenalyst Dashboard"}
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
