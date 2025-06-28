
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const QuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUploadDocuments = () => {
    navigate('/dashboard/upload');
  };

  const handleStartNewAnalysis = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          title: `Analysis ${new Date().toLocaleDateString()}`,
          description: 'New analysis created from dashboard',
          status: 'Draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activities').insert({
        user_id: user.id,
        action: 'Analysis Created',
        entity_type: 'Analysis',
        entity_id: data.id,
        description: `New analysis "${data.title}" created`
      });

      toast({
        title: "Analysis Created",
        description: "New analysis has been created successfully.",
      });

      navigate(`/dashboard/analysis/${data.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new analysis.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = () => {
    navigate('/dashboard/reports');
  };

  const quickActions = [
    {
      title: 'Upload Documents',
      description: 'Upload new documents for analysis',
      icon: Upload,
      action: handleUploadDocuments,
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      title: 'Start New Analysis',
      description: 'Begin a new compliance analysis',
      icon: FileText,
      action: handleStartNewAnalysis,
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'hover:from-green-600 hover:to-green-700',
    },
    {
      title: 'Generate Report',
      description: 'Create comprehensive reports',
      icon: BarChart,
      action: handleGenerateReport,
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'hover:from-purple-600 hover:to-purple-700',
    },
  ];

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`bg-gradient-to-r ${action.gradient} ${action.hoverGradient} text-white p-6 h-auto flex flex-col items-center space-y-3 border-0 shadow-lg transition-all duration-300 transform hover:scale-105`}
            >
              <action.icon className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold text-base">{action.title}</div>
                <div className="text-sm opacity-90 mt-1">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
