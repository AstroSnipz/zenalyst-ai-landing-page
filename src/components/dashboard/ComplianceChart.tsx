
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
      <Card>
        <CardHeader>
          <CardTitle>Compliance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#7c3aed" 
                strokeWidth={2}
                dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceChart;
