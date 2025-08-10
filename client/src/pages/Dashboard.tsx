import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Search, 
  User, 
  Briefcase, 
  Plus,
  Clock,
  MapPin,
  Phone,
  Star,
  Users,
  X
} from 'lucide-react';
// JobPostingForm component will be created later

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);

  // Queries
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings/user', user?.id],
    enabled: !!user?.id,
  });

  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ['/api/workers'],
  });

  const { data: jobPostings, isLoading: jobPostingsLoading } = useQuery({
    queryKey: ['/api/job-postings/client', user?.id],
    enabled: !!user?.id,
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleContactWorker = (worker: any) => {
    toast({
      title: "Contact Worker",
      description: `Contacting ${worker.firstName} ${worker.lastName}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Welcome back, {user.firstName}
              </h1>
              <div className="flex items-center gap-4 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user.id}
                </span>
                <span className="text-sm text-gray-600">
                  Active member
                </span>
              </div>
              <p className="text-gray-600 max-w-2xl">
                Manage your service requests, connect with verified workers, and track your bookings efficiently.
              </p>
            </div>
            <Dialog open={isJobFormOpen} onOpenChange={setIsJobFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Post a New Job</DialogTitle>
                  <p className="text-muted-foreground">
                    Get competitive bids from qualified workers across Tamil Nadu
                  </p>
                </DialogHeader>
                <div className="p-6 text-center">
                  <p className="text-gray-600 mb-4">Job posting form will be available soon.</p>
                  <Button onClick={() => setIsJobFormOpen(false)} variant="outline">
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Professional Navigation Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="h-auto p-0 bg-white border border-gray-200 rounded-t-lg">
            <div className="flex w-full border-b border-gray-200">
              <TabsTrigger 
                value="bookings" 
                className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-white py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 rounded-none bg-transparent"
              >
                My Bookings
              </TabsTrigger>
              <TabsTrigger 
                value="search"
                className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-white py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 rounded-none bg-transparent"
              >
                Find Workers
              </TabsTrigger>
              <TabsTrigger 
                value="jobs"
                className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-white py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 rounded-none bg-transparent"
              >
                My Jobs
              </TabsTrigger>
              <TabsTrigger 
                value="bids"
                className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-white py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 rounded-none bg-transparent"
              >
                Bids
              </TabsTrigger>
              <TabsTrigger 
                value="profile"
                className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-white py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 rounded-none bg-transparent"
              >
                Profile
              </TabsTrigger>
            </div>
          </TabsList>

          {/* My Bookings Tab */}
          <TabsContent value="bookings" className="bg-white rounded-b-lg shadow-sm border border-t-0 border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">My Service Bookings</h2>
                </div>
              </div>
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : !bookings || bookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start by searching for workers and booking your first service.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    <Search className="h-4 w-4 mr-2" />
                    Find Workers
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking: any) => (
                    <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold capitalize text-gray-900">
                            {booking.serviceCategory.replace('_', ' ')} Service
                          </h4>
                          <p className="text-sm text-gray-600">
                            Booking ID: {booking.id.substring(0, 8)}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm p-3 bg-gray-50 rounded-md text-gray-700">
                        {booking.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Find Workers Tab */}
          <TabsContent value="search" className="bg-white rounded-b-lg shadow-sm border border-t-0 border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Search className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Find Workers</h2>
                </div>
              </div>
              {workersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : !workers || workers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No workers found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search criteria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workers.map((worker: any) => (
                    <div key={worker.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {worker.firstName} {worker.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Professional Service Provider
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Available
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-600">
                          ₹500/hour
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleContactWorker(worker)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Book Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Jobs Tab */}
          <TabsContent value="jobs" className="bg-white rounded-b-lg shadow-sm border border-t-0 border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">My Job Postings</h2>
                </div>
              </div>
              {jobPostingsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : !jobPostings || jobPostings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                    <Briefcase className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
                  <p className="text-gray-600">
                    Use the "Post a New Job" button above to connect with skilled workers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobPostings.map((job: any) => (
                    <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 mb-2">{job.title}</h4>
                      <p className="text-gray-600">{job.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="bids" className="bg-white rounded-b-lg shadow-sm border border-t-0 border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Job Bids</h2>
                </div>
              </div>
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h3>
                <p className="text-gray-600">
                  Bids will appear here when workers respond to your job postings.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="bg-white rounded-b-lg shadow-sm border border-t-0 border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Details Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500">Full Name</span>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Mobile</span>
                      <p className="font-medium">{user.mobile}</p>
                    </div>
                    {user.email && (
                      <div>
                        <span className="text-sm text-gray-500">Email</span>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-500">District</span>
                      <p className="font-medium">{user.district || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Activity Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Account Activity</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500">User ID</span>
                      <p className="font-medium font-mono text-sm">{user.id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Member Since</span>
                      <p className="font-medium">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Account Status</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}