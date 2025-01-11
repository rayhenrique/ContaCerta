const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', reportController.getReportData);
router.get('/export/pdf', reportController.exportPDF);
router.get('/export/excel', reportController.exportExcel);

module.exports = router;
