const dashboardService = require('../services/dashboardService');

/**
 * GET /api/dashboard
 */
const getData = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard data.' });
  }
};

module.exports = { getData };
