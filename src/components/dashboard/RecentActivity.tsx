
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  action: string;
  entity_type: string | null;
  description: string | null;
  created_at: string;
}

const RecentActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
      subscribeToUpdates();
    }
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('activity-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activities' }, 
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActivityIcon = (action: string) => {
    return action.charAt(0).toUpperCase();
  };

  const getActivityColor = (entityType: string | null) => {
    switch (entityType) {
      case 'Document': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'Analysis': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'Red Flag': return 'bg-gradient-to-r from-red-500 to-red-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getBadgeVariant = (entityType: string | null) => {
    switch (entityType) {
      case 'Document': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Analysis': return 'bg-green-50 text-green-700 border-green-200';
      case 'Red Flag': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                  <AvatarFallback className={`${getActivityColor(activity.entity_type)} text-white font-semibold`}>
                    {getActivityIcon(activity.action)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {activity.action}
                    </p>
                    {activity.entity_type && (
                      <Badge className={`text-xs px-2 py-1 border ${getBadgeVariant(activity.entity_type)}`}>
                        {activity.entity_type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
