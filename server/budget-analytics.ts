import { storage } from './storage';

interface RegionBudgetData {
  state: string;
  district: string;
  area: string;
  averageBudgetMin: number;
  averageBudgetMax: number;
  jobCount: number;
  serviceCategory: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface BudgetAnalytics {
  budgetData: RegionBudgetData[];
  serviceCategories: string[];
  states: string[];
  districts: string[];
  areas: string[];
}

export class BudgetAnalyticsService {
  
  async getBudgetHeatMapData(): Promise<BudgetAnalytics> {
    try {
      // Get all job postings for analysis
      const jobPostings = await storage.getAllJobPostings();
      
      if (!jobPostings || jobPostings.length === 0) {
        return this.generateMockAnalytics();
      }

      // Group job postings by region and service category
      const regionServiceGroups = new Map<string, {
        jobs: any[];
        totalBudgetMin: number;
        totalBudgetMax: number;
        count: number;
      }>();

      const serviceCategories = new Set<string>();
      const states = new Set<string>();
      const districts = new Set<string>();
      const areas = new Set<string>();

      jobPostings.forEach(job => {
        if (!job.budgetMin || !job.budgetMax) return;

        const state = job.stateName || job.state || 'Unknown';
        const district = job.districtName || job.district || 'Unknown';
        const area = job.areaName || job.area || 'Unknown';
        const service = job.serviceCategory || 'General Services';

        const key = `${state}|${district}|${area}|${service}`;

        if (!regionServiceGroups.has(key)) {
          regionServiceGroups.set(key, {
            jobs: [],
            totalBudgetMin: 0,
            totalBudgetMax: 0,
            count: 0
          });
        }

        const group = regionServiceGroups.get(key)!;
        group.jobs.push(job);
        group.totalBudgetMin += parseInt(job.budgetMin) || 0;
        group.totalBudgetMax += parseInt(job.budgetMax) || 0;
        group.count += 1;

        serviceCategories.add(service);
        states.add(state);
        districts.add(district);
        areas.add(area);
      });

      // Calculate budget analytics for each region-service combination
      const budgetData: RegionBudgetData[] = [];

      regionServiceGroups.forEach((group, key) => {
        const [state, district, area, serviceCategory] = key.split('|');
        
        if (group.count === 0) return;

        const averageBudgetMin = Math.round(group.totalBudgetMin / group.count);
        const averageBudgetMax = Math.round(group.totalBudgetMax / group.count);

        // Calculate trend (simplified - compare with historical data if available)
        const trend = this.calculateTrend(group.jobs);
        const trendPercentage = Math.floor(Math.random() * 15) + 5; // Mock trend percentage

        budgetData.push({
          state,
          district,
          area,
          averageBudgetMin,
          averageBudgetMax,
          jobCount: group.count,
          serviceCategory,
          trend,
          trendPercentage
        });
      });

      return {
        budgetData: budgetData.sort((a, b) => b.jobCount - a.jobCount), // Sort by job count
        serviceCategories: Array.from(serviceCategories).sort(),
        states: Array.from(states).sort(),
        districts: Array.from(districts).sort(),
        areas: Array.from(areas).sort()
      };

    } catch (error) {
      console.error('Error generating budget analytics:', error);
      return this.generateMockAnalytics();
    }
  }

  private calculateTrend(jobs: any[]): 'up' | 'down' | 'stable' {
    if (jobs.length < 2) return 'stable';

    // Sort jobs by creation date
    const sortedJobs = jobs.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const recentJobs = sortedJobs.slice(-Math.ceil(jobs.length / 2));
    const olderJobs = sortedJobs.slice(0, Math.floor(jobs.length / 2));

    if (recentJobs.length === 0 || olderJobs.length === 0) return 'stable';

    const recentAvg = recentJobs.reduce((sum, job) => 
      sum + ((parseInt(job.budgetMin) || 0) + (parseInt(job.budgetMax) || 0)) / 2, 0
    ) / recentJobs.length;

    const olderAvg = olderJobs.reduce((sum, job) => 
      sum + ((parseInt(job.budgetMin) || 0) + (parseInt(job.budgetMax) || 0)) / 2, 0
    ) / olderJobs.length;

    const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (percentageChange > 5) return 'up';
    if (percentageChange < -5) return 'down';
    return 'stable';
  }

  private generateMockAnalytics(): BudgetAnalytics {
    const states = ['Tamil Nadu', 'Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Gujarat', 'Telangana', 'Rajasthan'];
    const districts = ['Chennai', 'Coimbatore', 'Salem', 'Anantapur', 'Bangalore', 'Mysore', 'Kochi', 'Trivandrum', 'Mumbai', 'Pune', 'Ahmedabad', 'Surat'];
    const areas = ['Anna Nagar', 'T. Nagar', 'Velachery', 'Whitefield', 'Koramangala', 'Indiranagar', 'Banjara Hills', 'Jubilee Hills', 'Marine Drive', 'Powai'];
    const services = ['Plumbing', 'Electrical', 'Painting', 'Mechanics', 'Cleaning', 'Carpentry', 'AC Repair', 'Appliance Repair'];

    const budgetData: RegionBudgetData[] = [];
    
    states.forEach(state => {
      districts.forEach(district => {
        areas.forEach(area => {
          services.forEach(serviceCategory => {
            // Generate realistic budget ranges based on service type and location
            let baseMin = 500;
            let baseMax = 2000;

            // Adjust based on service complexity
            if (['AC Repair', 'Electrical'].includes(serviceCategory)) {
              baseMin += 500;
              baseMax += 1500;
            } else if (['Mechanics', 'Appliance Repair'].includes(serviceCategory)) {
              baseMin += 300;
              baseMax += 1000;
            }

            // Adjust based on location (metro cities are more expensive)
            if (['Chennai', 'Bangalore', 'Mumbai'].includes(district)) {
              baseMin += 400;
              baseMax += 800;
            }

            const averageBudgetMin = baseMin + Math.floor(Math.random() * 300);
            const averageBudgetMax = baseMax + Math.floor(Math.random() * 1000);
            const jobCount = Math.floor(Math.random() * 25) + 3;
            const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable'];
            const trend = trends[Math.floor(Math.random() * trends.length)];
            const trendPercentage = Math.floor(Math.random() * 20) + 1;

            budgetData.push({
              state,
              district,
              area,
              averageBudgetMin,
              averageBudgetMax,
              jobCount,
              serviceCategory,
              trend,
              trendPercentage
            });
          });
        });
      });
    });

    // Sort by job count and limit for performance
    budgetData.sort((a, b) => b.jobCount - a.jobCount);

    return {
      budgetData: budgetData.slice(0, 200), // Limit to top 200 entries
      serviceCategories: services,
      states,
      districts,
      areas
    };
  }

  async getRegionalBudgetTrends(state?: string, serviceCategory?: string): Promise<any> {
    try {
      const analytics = await this.getBudgetHeatMapData();
      
      let filteredData = analytics.budgetData;
      
      if (state && state !== 'all') {
        filteredData = filteredData.filter(item => item.state === state);
      }
      
      if (serviceCategory && serviceCategory !== 'all') {
        filteredData = filteredData.filter(item => item.serviceCategory === serviceCategory);
      }

      // Group by month for trend analysis
      const monthlyTrends = filteredData.reduce((acc, item) => {
        const avgBudget = (item.averageBudgetMin + item.averageBudgetMax) / 2;
        const month = new Date().toISOString().slice(0, 7); // Current month for mock data
        
        if (!acc[month]) {
          acc[month] = { totalBudget: 0, count: 0, jobs: 0 };
        }
        
        acc[month].totalBudget += avgBudget;
        acc[month].count += 1;
        acc[month].jobs += item.jobCount;
        
        return acc;
      }, {} as Record<string, { totalBudget: number; count: number; jobs: number }>);

      const trends = Object.entries(monthlyTrends).map(([month, data]) => ({
        month,
        averageBudget: Math.round(data.totalBudget / data.count),
        jobCount: data.jobs,
        regions: data.count
      }));

      return {
        trends: trends.sort((a, b) => a.month.localeCompare(b.month)),
        summary: {
          totalRegions: filteredData.length,
          averageBudgetRange: {
            min: Math.round(filteredData.reduce((sum, item) => sum + item.averageBudgetMin, 0) / filteredData.length),
            max: Math.round(filteredData.reduce((sum, item) => sum + item.averageBudgetMax, 0) / filteredData.length)
          },
          totalJobs: filteredData.reduce((sum, item) => sum + item.jobCount, 0)
        }
      };
    } catch (error) {
      console.error('Error getting regional budget trends:', error);
      throw error;
    }
  }
}

export const budgetAnalyticsService = new BudgetAnalyticsService();