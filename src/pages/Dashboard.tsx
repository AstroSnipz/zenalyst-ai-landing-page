
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatCards from '@/components/dashboard/StatCards';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import ComplianceChart from '@/components/dashboard/ComplianceChart';

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 p-6 space-y-8">
            <StatCards />
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <QuickActions />
              </div>
              <div>
                <RecentActivity />
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ComplianceChart />
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-white p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Insights</h3>
                  <p className="text-gray-600">More dashboard widgets and analytics will be available here.</p>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
