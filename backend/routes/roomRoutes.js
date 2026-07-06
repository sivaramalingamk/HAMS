const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.post('/book', protect, requireRole('admin'), roomController.bookBed);
router.get('/available', protect, roomController.getAvailableRooms);
router.get('/occupancy', protect, requireRole('admin'), roomController.getRoomOccupancy);

module.exports = router;
