
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  documentsProcessed: number;
  issuesDetected: number;
  complianceScore: number;
  activeAnalyses: number;
}

const StatCards = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    documentsProcessed: 0,
    issuesDetected: 0,
    complianceScore: 0,
    activeAnalyses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      subscribeToUpdates();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const [documentsData, redFlagsData, analysesData, activeAnalysesData] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('processed', true),
        supabase.from('red_flags').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('resolved', false),
        supabase.from('analyses').select('compliance_score').eq('user_id', user.id).not('compliance_score', 'is', null),
        supabase.from('analyses').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'In Progress'),
      ]);

      const avgCompliance = analysesData.data?.length 
        ? Math.round(analysesData.data.reduce((sum, analysis) => sum + (analysis.compliance_score || 0), 0) / analysesData.data.length)
        : 0;

      setStats({
        documentsProcessed: documentsData.count || 0,
        issuesDetected: redFlagsData.count || 0,
        complianceScore: avgCompliance,
        activeAnalyses: activeAnalysesData.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'red_flags' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analyses' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const statCards = [
    {
      title: 'Documents Processed',
      value: stats.documentsProcessed,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Issues Detected',
      value: stats.issuesDetected,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-red-600',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Compliance Score',
      value: `${stats.complianceScore}%`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Active Analyses',
      value: stats.activeAnalyses,
      icon: Activity,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-4 rounded-xl ${stat.iconBg} shadow-inner`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatCards;
