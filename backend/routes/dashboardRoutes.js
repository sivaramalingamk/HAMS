const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Admin gets dashboard stats
router.get('/stats', protect, requireRole('admin'), dashboardController.getStats);

module.exports = router;
