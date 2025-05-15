import React, { useState, useEffect } from 'react';
import MainLayout from '../Layout/MainLayout';
import MetricsCard from './MetricsCard';
import Chart from './Chart';
import { useAnalytics } from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const { getMessageMetrics, getResponseMetrics, getPlatformBreakdown, getMessageCategories } = useAnalytics();
  
  const [timeframe, setTimeframe] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    responseRate: 0,
    averageResponseTime: 0,
    platformBreakdown: { instagram: 0, youtube: 0 },
    messageCategories: []
  });
  
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true);
        
        // Set date range based on selected timeframe
        const endDate = new Date();
        const startDate = new Date();
        
        if (timeframe === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (timeframe === 'week') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeframe === 'month') {
          startDate.setMonth(startDate.getMonth() - 1);
        }
        
        // Fetch analytics data
        const [messageMetrics, responseMetrics, platformData, categoryData] = await Promise.all([
          getMessageMetrics(user.id, { startDate, endDate }),
          getResponseMetrics(user.id, { startDate, endDate }),
          getPlatformBreakdown(user.id, { startDate, endDate }),
          getMessageCategories(user.id, { startDate, endDate }),
        ]);
        
        setMetrics({
          totalMessages: messageMetrics?.totalProcessed || 0,
          responseRate: responseMetrics?.responseRate || 0,
          averageResponseTime: responseMetrics?.averageResponseTime || 0,
          platformBreakdown: platformData || { instagram: 0, youtube: 0 },
          messageCategories: categoryData || []
        });
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalyticsData();
  }, [user.id, timeframe, getMessageMetrics, getResponseMetrics, getPlatformBreakdown, getMessageCategories]);
  
  // Prepare data for charts
  const platformChartData = {
    labels: Object.keys(metrics.platformBreakdown).map(platform => 
      platform.charAt(0).toUpperCase() + platform.slice(1)
    ),
    datasets: [
      {
        data: Object.values(metrics.platformBreakdown),
        backgroundColor: ['#E9A0A0', '#9694FF'],
        hoverBackgroundColor: ['#E57373', '#7B79FF'],
      },
    ],
  };
  
  const categoryChartData = {
    labels: metrics.messageCategories.map(category => category.name),
    datasets: [
      {
        data: metrics.messageCategories.map(category => category.count),
        backgroundColor: [
          '#4FD1C5',
          '#3182CE',
          '#805AD5',
          '#DD6B20',
          '#38A169',
          '#718096',
        ],
        hoverBackgroundColor: [
          '#38B2AC',
          '#2B6CB0',
          '#6B46C1',
          '#C05621',
          '#2F855A',
          '#4A5568',
        ],
      },
    ],
  };
  
  const handleExport = () => {
    // Export analytics data as CSV
    const csvContent = [
      'Metric,Value',
      `Total Messages,${metrics.totalMessages}`,
      `Response Rate,${(metrics.responseRate * 100).toFixed(2)}%`,
      `Average Response Time,${metrics.averageResponseTime.toFixed(2)} seconds`,
      '\nPlatform Distribution',
      ...Object.entries(metrics.platformBreakdown).map(([platform, count]) => 
        `${platform},${count}`
      ),
      '\nMessage Categories',
      ...metrics.messageCategories.map(category => 
        `${category.name},${category.count}`
      )
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `avatar-analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };
  
  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
        
        <div className="mt-3 sm:mt-0 flex items-center">
          <div className="mr-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <MetricsCard
              title="Total Messages"
              value={metrics.totalMessages}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
              color="blue"
            />
            
            <MetricsCard
              title="Response Rate"
              value={`${(metrics.responseRate * 100).toFixed(1)}%`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="green"
            />
            
            <MetricsCard
              title="Avg Response Time"
              value={`${metrics.averageResponseTime.toFixed(1)}s`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="purple"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Distribution Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Distribution</h2>
              <div className="aspect-w-16 aspect-h-9">
                <Chart 
                  type="doughnut" 
                  data={platformChartData} 
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </div>
            
            {/* Message Categories Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Message Categories</h2>
              <div className="aspect-w-16 aspect-h-9">
                <Chart 
                  type="pie" 
                  data={categoryChartData} 
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default AnalyticsDashboard;