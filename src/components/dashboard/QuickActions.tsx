
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
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Start New Analysis',
      description: 'Begin a new compliance analysis',
      icon: FileText,
      action: handleStartNewAnalysis,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Generate Report',
      description: 'Create comprehensive reports',
      icon: BarChart,
      action: handleGenerateReport,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white p-6 h-auto flex flex-col items-center space-y-2`}
            >
              <action.icon className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">{action.title}</div>
                <div className="text-sm opacity-90">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
