import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobMarketHeatMap } from "@/components/JobMarketHeatMap";
import { BarChart3, TrendingUp, Users, MapPin, Clock, Activity, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function JobMarketDashboard() {
  // Mock data for analytics
  const hourlyData = [
    { hour: '6 AM', jobs: 12 },
    { hour: '8 AM', jobs: 45 },
    { hour: '10 AM', jobs: 78 },
    { hour: '12 PM', jobs: 92 },
    { hour: '2 PM', jobs: 87 },
    { hour: '4 PM', jobs: 95 },
    { hour: '6 PM', jobs: 108 },
    { hour: '8 PM', jobs: 76 },
    { hour: '10 PM', jobs: 34 },
  ];

  const weeklyTrend = [
    { day: 'Mon', posted: 145, completed: 132 },
    { day: 'Tue', posted: 167, completed: 149 },
    { day: 'Wed', posted: 189, completed: 156 },
    { day: 'Thu', posted: 201, completed: 178 },
    { day: 'Fri', posted: 234, completed: 198 },
    { day: 'Sat', posted: 278, completed: 245 },
    { day: 'Sun', posted: 198, completed: 167 },
  ];

  const serviceDistribution = [
    { name: 'Plumbing', value: 28, color: '#3B82F6' },
    { name: 'Electrical', value: 22, color: '#10B981' },
    { name: 'Painting', value: 18, color: '#F59E0B' },
    { name: 'Cleaning', value: 15, color: '#8B5CF6' },
    { name: 'Carpentry', value: 10, color: '#EF4444' },
    { name: 'Others', value: 7, color: '#6B7280' },
  ];

  const topAreas = [
    { area: 'T. Nagar', jobs: 145, growth: '+12%' },
    { area: 'Anna Nagar', jobs: 132, growth: '+8%' },
    { area: 'Velachery', jobs: 118, growth: '+15%' },
    { area: 'Adyar', jobs: 97, growth: '+5%' },
    { area: 'Mylapore', jobs: 89, growth: '+9%' },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Job Market Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time insights into job market trends and demand patterns across Chennai
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                  <p className="text-3xl font-bold text-blue-600">1,247</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from yesterday
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jobs Completed</p>
                  <p className="text-3xl font-bold text-green-600">892</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8% completion rate
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Workers</p>
                  <p className="text-3xl font-bold text-purple-600">2,156</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    89% response rate
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                  <p className="text-3xl font-bold text-orange-600">12m</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    -3m faster today
                  </p>
                </div>
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="heatmap" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="areas">Top Areas</TabsTrigger>
          </TabsList>

          {/* Heat Map Tab */}
          <TabsContent value="heatmap" className="space-y-6">
            <JobMarketHeatMap height={600} autoPlay={true} />
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Hourly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Job Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="jobs" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="posted" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        name="Jobs Posted"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        name="Jobs Completed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Service Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={serviceDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {serviceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Service Categories Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {serviceDistribution.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <Badge variant="outline">{service.value}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Top Areas Tab */}
          <TabsContent value="areas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Top Performing Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{area.area}</h3>
                          <p className="text-sm text-muted-foreground">{area.jobs} active jobs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          {area.growth}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Peak Hours</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Most job postings occur between 4 PM - 8 PM on weekdays
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-100">High Demand</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Plumbing and electrical services show highest demand this week
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Growth Areas</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Velachery and T. Nagar showing 15%+ growth in job postings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}