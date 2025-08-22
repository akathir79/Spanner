import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Target,
  Lightbulb,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

interface SpendingAnalytics {
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    year: number;
    totalSpent: number;
    totalEarned: number;
    netChange: number;
    transactionCount: number;
  }>;
  weeklyAverage: number;
  topSpendingDays: Array<{
    dayOfWeek: string;
    averageSpent: number;
  }>;
  savingsInsights: {
    monthlyAverage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    recommendation: string;
  };
  budgetSuggestions: Array<{
    category: string;
    currentMonthlySpend: number;
    suggestedBudget: number;
    reason: string;
  }>;
}

interface TransactionInsights {
  period: string;
  totalTransactions: number;
  totalSpent: number;
  totalEarned: number;
  netChange: number;
  avgTransactionSize: number;
  mostFrequentCategory: {
    category: string;
    count: number;
  } | null;
}

export default function WalletAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState(6);

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<SpendingAnalytics>({
    queryKey: ['/api/wallet/analytics', selectedPeriod],
    queryFn: () => apiRequest('GET', `/api/wallet/analytics?months=${selectedPeriod}`).then(res => res.json()),
  });

  // Fetch insights data
  const { data: insights, isLoading: insightsLoading } = useQuery<TransactionInsights>({
    queryKey: ['/api/wallet/insights'],
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-lime-500'
    ];
    return colors[index % colors.length];
  };

  if (analyticsLoading || insightsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="wallet-analytics">
      {/* Period Selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Wallet Analytics</h2>
        <div className="flex gap-2">
          {[3, 6, 12].map((months) => (
            <Button
              key={months}
              variant={selectedPeriod === months ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(months)}
              data-testid={`button-period-${months}`}
            >
              {months} months
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{insights?.totalTransactions || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Change</p>
                  <p className={`text-2xl font-bold ${
                    (insights?.netChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(insights?.netChange || 0) >= 0 ? '+' : ''}₹{Math.abs(insights?.netChange || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                {(insights?.netChange || 0) >= 0 ? (
                  <ArrowUpRight className="h-8 w-8 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weekly Average</p>
                  <p className="text-2xl font-bold">₹{(analytics?.weeklyAverage || 0).toLocaleString('en-IN')}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                  <p className="text-2xl font-bold">₹{(insights?.avgTransactionSize || 0).toLocaleString('en-IN')}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-6">
        <TabsList>
          <TabsTrigger value="breakdown">Category Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights & Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Spending by Category
              </CardTitle>
              <CardDescription>
                Your spending breakdown across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.categoryBreakdown.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No spending data available for this period
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics?.categoryBreakdown.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(index)}`} />
                          <span className="font-medium">{category.category}</span>
                          <Badge variant="secondary">{category.transactionCount} transactions</Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{category.amount.toLocaleString('en-IN')}</div>
                          <div className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Spending Trends
              </CardTitle>
              <CardDescription>
                Track your spending and earning patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.monthlyTrends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No trend data available for this period
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics?.monthlyTrends.map((month) => (
                    <div key={`${month.month}-${month.year}`} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{month.month} {month.year}</h4>
                        <Badge variant={month.netChange >= 0 ? "default" : "destructive"}>
                          {month.netChange >= 0 ? '+' : ''}₹{month.netChange.toLocaleString('en-IN')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Earned: </span>
                          <span className="text-green-600 font-medium">₹{month.totalEarned.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Spent: </span>
                          <span className="text-red-600 font-medium">₹{month.totalSpent.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Transactions: </span>
                          <span className="font-medium">{month.transactionCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Spending Days */}
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Days</CardTitle>
              <CardDescription>
                Days of the week when you spend the most
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topSpendingDays.map((day, index) => (
                  <div key={day.dayOfWeek} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        {index + 1}
                      </Badge>
                      <span>{day.dayOfWeek}</span>
                    </div>
                    <span className="font-semibold">₹{day.averageSpent.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* Savings Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTrendIcon(analytics?.savingsInsights.trend || 'stable')}
                Savings Insights
              </CardTitle>
              <CardDescription>
                Understanding your financial patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Monthly Average</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{(analytics?.savingsInsights.monthlyAverage || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Recommendation</h4>
                      <p className="text-sm text-muted-foreground">
                        {analytics?.savingsInsights.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Budget Suggestions
              </CardTitle>
              <CardDescription>
                Personalized budget recommendations based on your spending
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.budgetSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No budget suggestions available yet. Spend more to get personalized recommendations!
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics?.budgetSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{suggestion.category}</h4>
                        <Badge variant="outline">
                          Save ₹{(suggestion.currentMonthlySpend - suggestion.suggestedBudget).toLocaleString('en-IN')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span className="font-medium">₹{suggestion.currentMonthlySpend.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Suggested: </span>
                          <span className="font-medium">₹{suggestion.suggestedBudget.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Frequent Category */}
          {insights?.mostFrequentCategory && (
            <Card>
              <CardHeader>
                <CardTitle>Most Active Category</CardTitle>
                <CardDescription>
                  Your most frequently used spending category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {insights.mostFrequentCategory.category}
                  </div>
                  <div className="text-lg text-muted-foreground">
                    {insights.mostFrequentCategory.count} transactions in the last 30 days
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}