import { useState, useEffect } from 'react';
import { usePostHog, useFeatureFlagEnabled, useActiveFeatureFlags } from 'posthog-js/react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Activity, Users, Flag, Play, Pause, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const posthog = usePostHog();
  const { userEmail, isLoggedIn } = useAuth();
  const activeFlags = useActiveFeatureFlags();
  const isAdmin = useFeatureFlagEnabled('is_admin');
  const [events, setEvents] = useState<any[]>([]);
  const [sessionRecording, setSessionRecording] = useState(false);

  // Simulate real-time events for demo
  useEffect(() => {
    const mockEvents = [
      { name: 'page_view', timestamp: new Date(), properties: { path: '/analytics' } },
      { name: 'feature_flag_called', timestamp: new Date(), properties: { flag: 'is_admin' } },
      { name: 'user_identified', timestamp: new Date(), properties: { email: userEmail } }
    ];
    setEvents(mockEvents);
  }, [userEmail]);

  const handleToggleRecording = () => {
    if (posthog) {
      if (sessionRecording) {
        posthog.stopSessionRecording();
      } else {
        posthog.startSessionRecording();
      }
      setSessionRecording(!sessionRecording);
    }
  };

  const captureTestEvent = () => {
    if (posthog) {
      posthog.capture('analytics_demo_event', {
        demo: true,
        timestamp: new Date().toISOString(),
        user_type: isAdmin ? 'admin' : 'user'
      });
      
      // Add to local events for immediate feedback
      setEvents(prev => [{
        name: 'analytics_demo_event',
        timestamp: new Date(),
        properties: { demo: true, user_type: isAdmin ? 'admin' : 'user' }
      }, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">PostHog Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time analytics and feature flag monitoring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* User Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Status</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoggedIn ? 'Logged In' : 'Anonymous'}</div>
              <p className="text-xs text-muted-foreground">
                {userEmail || 'No user identified'}
              </p>
            </CardContent>
          </Card>

          {/* Active Flags */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feature Flags</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeFlags ? Object.keys(activeFlags).length : 0}
              </div>
              <p className="text-xs text-muted-foreground">Active flags</p>
            </CardContent>
          </Card>

          {/* Session Recording */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Recording</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={sessionRecording ? "default" : "secondary"}>
                  {sessionRecording ? 'Recording' : 'Stopped'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleRecording}
                >
                  {sessionRecording ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Events Captured */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <Button
                size="sm"
                variant="outline"
                onClick={captureTestEvent}
                className="mt-2"
              >
                Capture Test Event
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Flags Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeFlags && Object.keys(activeFlags).length > 0 ? (
                  Object.entries(activeFlags).map(([flag, value]) => (
                    <div key={flag} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{flag}</span>
                      <Badge variant={value ? "default" : "secondary"}>
                        {String(value)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No active feature flags</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {events.map((event, index) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-3">
                    <div className="text-sm font-medium">{event.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()}
                    </div>
                    {event.properties && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(event.properties, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}