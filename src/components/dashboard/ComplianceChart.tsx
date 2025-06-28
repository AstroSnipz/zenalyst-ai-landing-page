
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';

interface ChartData {
  date: string;
  score: number;
}

const ComplianceChart = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChartData();
    }
  }, [user]);

  const fetchChartData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('compliance_score, created_at')
        .eq('user_id', user.id)
        .not('compliance_score', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Generate chart data for the last 30 days
      const chartData: ChartData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayData = data?.filter(item => 
          format(new Date(item.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        
        const averageScore = dayData?.length 
          ? Math.round(dayData.reduce((sum, item) => sum + (item.compliance_score || 0), 0) / dayData.length)
          : chartData.length > 0 ? chartData[chartData.length - 1].score : 0;

        chartData.push({
          date: format(date, 'MMM dd'),
          score: averageScore,
        });
      }

      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Compliance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradient-to-r from-purple-500 to-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">Compliance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                interval="preserveStartEnd"
                stroke="#e5e7eb"
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="url(#colorGradient)"
                strokeWidth={3}
                dot={{ fill: '#7c3aed', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#7c3aed', strokeWidth: 2 }}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E3A8A" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceChart;
