import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Download, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AnalyticsData {
  totalQRCodes: number;
  weeklyCount: number;
  typeDistribution: Record<string, number>;
  recentActivity: Array<{
    eventType: string;
    contentType?: string;
    exportFormat?: string;
    timestamp: string;
  }>;
  downloadStats: Record<string, number>;
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatEventType = (eventType: string) => {
    switch (eventType) {
      case 'create': return 'QR Created';
      case 'download': return 'Downloaded';
      case 'share': return 'Shared';
      case 'view': return 'Viewed';
      default: return eventType;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'create': return '➕';
      case 'download': return '⬇️';
      case 'share': return '🔗';
      case 'view': return '👁️';
      default: return '📊';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Cards */}
        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total QR Codes</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{analytics.totalQRCodes}</p>
            </div>
            <div className="relative">
              <BarChart3 className="w-10 h-10 text-blue-400" />
              <div className="absolute inset-0 w-10 h-10 bg-blue-400/20 rounded-lg blur animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">This Week</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{analytics.weeklyCount}</p>
            </div>
            <div className="relative">
              <Calendar className="w-10 h-10 text-green-400" />
              <div className="absolute inset-0 w-10 h-10 bg-green-400/20 rounded-lg blur animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Most Used</p>
              <p className="text-3xl font-bold text-purple-400 capitalize mt-2">
                {Object.entries(analytics.typeDistribution).length > 0 
                  ? Object.entries(analytics.typeDistribution).reduce((a, b) => 
                      analytics.typeDistribution[a[0]] > analytics.typeDistribution[b[0]] ? a : b
                    )?.[0] || 'None'
                  : 'None'
                }
              </p>
            </div>
            <div className="relative">
              <TrendingUp className="w-10 h-10 text-purple-400" />
              <div className="absolute inset-0 w-10 h-10 bg-purple-400/20 rounded-lg blur animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Downloads</p>
              <p className="text-3xl font-bold text-orange-400 mt-2">
                {Object.values(analytics.downloadStats).length > 0 
                  ? Object.values(analytics.downloadStats).reduce((a, b) => a + b, 0) 
                  : 0
                }
              </p>
            </div>
            <div className="relative">
              <Download className="w-10 h-10 text-orange-400" />
              <div className="absolute inset-0 w-10 h-10 bg-orange-400/20 rounded-lg blur animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Type Distribution */}
        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
            <h2 className="text-xl font-semibold text-white">QR Type Distribution</h2>
          </div>
          <div className="space-y-5">
            {Object.entries(analytics.typeDistribution).map(([type, count]) => {
              const total = Object.values(analytics.typeDistribution).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              
              return (
                <div key={type} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-gray-300">{type}</span>
                    <span className="text-sm text-gray-400 font-mono">{percentage}%</span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(analytics.typeDistribution).length === 0 && (
              <p className="text-gray-400 text-center py-8">No data available yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-pink-400 to-pink-600 rounded-full"></div>
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analytics.recentActivity.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No recent activity</p>
            ) : (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 neumorphic-inset rounded-xl">
                  <div className="w-12 h-12 glass-card rounded-full flex items-center justify-center">
                    <span className="text-lg">{getEventIcon(activity.eventType)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {formatEventType(activity.eventType)}
                      {activity.contentType && (
                        <span className="text-gray-400"> • {activity.contentType}</span>
                      )}
                      {activity.exportFormat && (
                        <span className="text-gray-400"> • {activity.exportFormat.toUpperCase()}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Download Stats */}
      {Object.keys(analytics.downloadStats).length > 0 && (
        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></div>
            <h2 className="text-xl font-semibold text-white">Download Statistics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.downloadStats).map(([format, count]) => (
              <div key={format} className="text-center p-4 neumorphic-inset rounded-xl">
                <p className="text-2xl font-bold text-emerald-400">{count}</p>
                <p className="text-sm text-gray-400 uppercase font-medium mt-1">{format}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
