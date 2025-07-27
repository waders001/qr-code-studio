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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total QR Codes</p>
                <p className="text-2xl font-bold text-primary">{analytics.totalQRCodes}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-green-600">{analytics.weeklyCount}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Most Used</p>
                <p className="text-2xl font-bold text-purple-600 capitalize">
                  {Object.entries(analytics.typeDistribution).reduce((a, b) => 
                    analytics.typeDistribution[a[0]] > analytics.typeDistribution[b[0]] ? a : b
                  )?.[0] || 'None'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Object.values(analytics.downloadStats).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <Download className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>QR Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.typeDistribution).map(([type, count]) => {
                const total = Object.values(analytics.typeDistribution).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{type}</span>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent activity</p>
              ) : (
                analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm">{getEventIcon(activity.eventType)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {formatEventType(activity.eventType)}
                        {activity.contentType && (
                          <span className="text-muted-foreground"> • {activity.contentType}</span>
                        )}
                        {activity.exportFormat && (
                          <span className="text-muted-foreground"> • {activity.exportFormat.toUpperCase()}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Download Stats */}
      {Object.keys(analytics.downloadStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Download Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.downloadStats).map(([format, count]) => (
                <div key={format} className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-sm text-muted-foreground uppercase">{format}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
