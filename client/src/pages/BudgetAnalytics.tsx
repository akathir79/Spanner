import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BudgetHeatMap from '@/components/BudgetHeatMap';
import { TrendingUp, BarChart3, MapPin, IndianRupee } from 'lucide-react';

export default function BudgetAnalytics() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Budget Analytics Dashboard</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive insights into service pricing trends across India. Make informed decisions with real-time budget data.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">28+</div>
              <div className="text-sm text-gray-600">States Covered</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">500+</div>
              <div className="text-sm text-gray-600">Districts Analyzed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Service Categories</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <IndianRupee className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">₹1,500</div>
              <div className="text-sm text-gray-600">Avg. Job Value</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Heat Map Component */}
        <BudgetHeatMap className="w-full" />

        {/* Additional Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pricing Insights
              </CardTitle>
              <CardDescription>Key observations from budget analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Metro City Premium</h4>
                    <p className="text-sm text-gray-600">
                      Major cities like Chennai, Bangalore, and Mumbai typically charge 20-30% higher rates than smaller towns.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Service Complexity</h4>
                    <p className="text-sm text-gray-600">
                      Electrical and AC repair services command the highest rates, while basic cleaning services are most affordable.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Regional Variations</h4>
                    <p className="text-sm text-gray-600">
                      Southern states generally have more consistent pricing, while northern regions show greater variation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Market Trends
              </CardTitle>
              <CardDescription>Current market dynamics and predictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Growing Demand</h4>
                    <p className="text-sm text-gray-600">
                      Home services sector showing 15% month-over-month growth with increasing digitization.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Skill Premium</h4>
                    <p className="text-sm text-gray-600">
                      Specialized skills like smart home installation and solar panel services commanding premium rates.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Digital Adoption</h4>
                    <p className="text-sm text-gray-600">
                      Online booking platforms enabling better price transparency and competitive pricing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Guide */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">How to Use This Heat Map</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">For Clients:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Compare rates across different areas before posting jobs</li>
                  <li>• Set realistic budgets based on regional averages</li>
                  <li>• Identify cost-effective service areas nearby</li>
                  <li>• Understand seasonal pricing variations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">For Workers:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Benchmark your rates against market standards</li>
                  <li>• Identify high-value service areas to expand to</li>
                  <li>• Track pricing trends in your specialization</li>
                  <li>• Plan service area expansion strategically</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}