import { storage } from './storage';

export interface SpendingAnalytics {
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

export class WalletAnalyticsService {
  static async generateSpendingAnalytics(userId: string, months: number = 6): Promise<SpendingAnalytics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get all transactions for the period
      const transactions = await storage.getWalletTransactionsByDateRange(
        userId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Calculate category breakdown
      const categoryBreakdown = await this.calculateCategoryBreakdown(transactions);
      
      // Calculate monthly trends
      const monthlyTrends = await this.calculateMonthlyTrends(transactions);
      
      // Calculate weekly average
      const weeklyAverage = await this.calculateWeeklyAverage(transactions);
      
      // Calculate top spending days
      const topSpendingDays = await this.calculateTopSpendingDays(transactions);
      
      // Generate savings insights
      const savingsInsights = await this.generateSavingsInsights(monthlyTrends);
      
      // Generate budget suggestions
      const budgetSuggestions = await this.generateBudgetSuggestions(categoryBreakdown, monthlyTrends);

      return {
        categoryBreakdown,
        monthlyTrends,
        weeklyAverage,
        topSpendingDays,
        savingsInsights,
        budgetSuggestions
      };
    } catch (error) {
      console.error('Error generating spending analytics:', error);
      throw error;
    }
  }

  private static async calculateCategoryBreakdown(transactions: any[]): Promise<any[]> {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    let totalSpent = 0;

    transactions
      .filter(t => t.type === 'debit')
      .forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        const category = transaction.category || 'Other';
        
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { amount: 0, count: 0 });
        }
        
        const current = categoryMap.get(category)!;
        current.amount += amount;
        current.count += 1;
        totalSpent += amount;
      });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      transactionCount: data.count
    })).sort((a, b) => b.amount - a.amount);
  }

  private static async calculateMonthlyTrends(transactions: any[]): Promise<any[]> {
    const monthlyMap = new Map<string, {
      totalSpent: number;
      totalEarned: number;
      transactionCount: number;
      year: number;
    }>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const amount = parseFloat(transaction.amount);

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          totalSpent: 0,
          totalEarned: 0,
          transactionCount: 0,
          year: date.getFullYear()
        });
      }

      const monthly = monthlyMap.get(monthKey)!;
      if (transaction.type === 'debit') {
        monthly.totalSpent += amount;
      } else {
        monthly.totalEarned += amount;
      }
      monthly.transactionCount += 1;
    });

    return Array.from(monthlyMap.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
          .toLocaleDateString('en-IN', { month: 'short' });
        
        return {
          month: monthName,
          year: data.year,
          totalSpent: data.totalSpent,
          totalEarned: data.totalEarned,
          netChange: data.totalEarned - data.totalSpent,
          transactionCount: data.transactionCount
        };
      })
      .sort((a, b) => a.year - b.year);
  }

  private static async calculateWeeklyAverage(transactions: any[]): Promise<number> {
    const weeksSpent = new Map<string, number>();
    
    transactions
      .filter(t => t.type === 'debit')
      .forEach(transaction => {
        const date = new Date(transaction.createdAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week
        const weekKey = weekStart.toISOString().split('T')[0];
        
        const amount = parseFloat(transaction.amount);
        weeksSpent.set(weekKey, (weeksSpent.get(weekKey) || 0) + amount);
      });

    const totalWeeks = weeksSpent.size;
    const totalSpent = Array.from(weeksSpent.values()).reduce((sum, amount) => sum + amount, 0);
    
    return totalWeeks > 0 ? totalSpent / totalWeeks : 0;
  }

  private static async calculateTopSpendingDays(transactions: any[]): Promise<any[]> {
    const daySpending = new Map<string, { total: number; count: number }>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    transactions
      .filter(t => t.type === 'debit')
      .forEach(transaction => {
        const date = new Date(transaction.createdAt);
        const dayOfWeek = dayNames[date.getDay()];
        const amount = parseFloat(transaction.amount);

        if (!daySpending.has(dayOfWeek)) {
          daySpending.set(dayOfWeek, { total: 0, count: 0 });
        }

        const day = daySpending.get(dayOfWeek)!;
        day.total += amount;
        day.count += 1;
      });

    return Array.from(daySpending.entries())
      .map(([dayOfWeek, data]) => ({
        dayOfWeek,
        averageSpent: data.count > 0 ? data.total / data.count : 0
      }))
      .sort((a, b) => b.averageSpent - a.averageSpent);
  }

  private static async generateSavingsInsights(monthlyTrends: any[]): Promise<any> {
    if (monthlyTrends.length < 2) {
      return {
        monthlyAverage: 0,
        trend: 'stable' as const,
        recommendation: 'Need more transaction history for insights'
      };
    }

    const recentMonths = monthlyTrends.slice(-3);
    const monthlyAverage = recentMonths.reduce((sum, month) => sum + month.netChange, 0) / recentMonths.length;

    // Determine trend
    const firstMonth = recentMonths[0].netChange;
    const lastMonth = recentMonths[recentMonths.length - 1].netChange;
    const trendDiff = lastMonth - firstMonth;

    let trend: 'increasing' | 'decreasing' | 'stable';
    let recommendation: string;

    if (trendDiff > 50) {
      trend = 'increasing';
      recommendation = 'Great! Your savings are improving. Consider investing surplus funds.';
    } else if (trendDiff < -50) {
      trend = 'decreasing';
      recommendation = 'Your spending is increasing. Review your expenses and set budget limits.';
    } else {
      trend = 'stable';
      recommendation = 'Your spending patterns are stable. Look for opportunities to optimize.';
    }

    return {
      monthlyAverage,
      trend,
      recommendation
    };
  }

  private static async generateBudgetSuggestions(categoryBreakdown: any[], monthlyTrends: any[]): Promise<any[]> {
    const suggestions: any[] = [];

    if (monthlyTrends.length === 0) return suggestions;

    const currentMonth = monthlyTrends[monthlyTrends.length - 1];
    const avgMonthlySpent = monthlyTrends.reduce((sum, month) => sum + month.totalSpent, 0) / monthlyTrends.length;

    categoryBreakdown.forEach(category => {
      if (category.percentage > 30) {
        suggestions.push({
          category: category.category,
          currentMonthlySpend: category.amount,
          suggestedBudget: category.amount * 0.8, // Suggest 20% reduction
          reason: `High spending category (${category.percentage.toFixed(1)}% of total). Consider reducing by 20%.`
        });
      } else if (category.percentage > 20) {
        suggestions.push({
          category: category.category,
          currentMonthlySpend: category.amount,
          suggestedBudget: category.amount * 0.9, // Suggest 10% reduction
          reason: `Significant spending category. Small reductions can lead to meaningful savings.`
        });
      }
    });

    // Overall spending suggestion
    if (currentMonth.totalSpent > avgMonthlySpent * 1.2) {
      suggestions.push({
        category: 'Overall Spending',
        currentMonthlySpend: currentMonth.totalSpent,
        suggestedBudget: avgMonthlySpent * 1.1,
        reason: 'Current spending is 20% above average. Consider setting an overall monthly budget.'
      });
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  static async getTransactionInsights(userId: string): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const transactions = await storage.getWalletTransactionsByDateRange(
        userId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      const totalTransactions = transactions.length;
      const totalSpent = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalEarned = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const avgTransactionSize = totalTransactions > 0 ? (totalSpent + totalEarned) / totalTransactions : 0;

      // Most frequent transaction category
      const categoryCount = new Map<string, number>();
      transactions.forEach(t => {
        const category = t.category || 'Other';
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });

      const mostFrequentCategory = Array.from(categoryCount.entries())
        .sort((a, b) => b[1] - a[1])[0];

      return {
        period: '30 days',
        totalTransactions,
        totalSpent,
        totalEarned,
        netChange: totalEarned - totalSpent,
        avgTransactionSize,
        mostFrequentCategory: mostFrequentCategory ? {
          category: mostFrequentCategory[0],
          count: mostFrequentCategory[1]
        } : null
      };
    } catch (error) {
      console.error('Error generating transaction insights:', error);
      throw error;
    }
  }
}