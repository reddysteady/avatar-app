// Mock analytics data to simulate backend responses
export const mockAnalyticsData = {
  messageMetrics: {
    totalProcessed: 152,
    totalPending: 14,
    weeklyGrowth: 23,
    responseRate: 0.87
  },
  
  responseMetrics: {
    responseRate: 0.87,
    averageResponseTime: 4.2,
    autoResponseRate: 0.76,
    manualResponseRate: 0.11,
    userSatisfaction: 0.92
  },
  
  platformBreakdown: {
    instagram: 98,
    youtube: 54
  },
  
  messageCategories: [
    { name: 'General Questions', count: 56 },
    { name: 'Compliments', count: 37 },
    { name: 'Collaboration', count: 28 },
    { name: 'Technical Questions', count: 19 },
    { name: 'Complaints', count: 7 },
    { name: 'Other', count: 5 }
  ],
  
  timeSeries: {
    dates: [
      '2023-05-06', '2023-05-07', '2023-05-08', 
      '2023-05-09', '2023-05-10', '2023-05-11', '2023-05-12'
    ],
    messages: [18, 14, 22, 26, 31, 19, 22],
    responses: [16, 12, 21, 22, 26, 17, 18]
  }
};