const express = require('express');
const authMiddleware = require('../middlewares/auth');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');
const revenueController = require('../controllers/revenueController');
const expenseController = require('../controllers/expenseController');
const dashboardController = require('../controllers/dashboardController');
const reportController = require('../controllers/reportController');

const router = express.Router();

// Rotas públicas
router.post('/auth/login', authController.login);

// Middleware de autenticação para rotas protegidas
router.use(authMiddleware);

// Rotas de usuários
router.get('/users', userController.index);
router.post('/users', userController.create);
router.get('/users/:id', userController.show);
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.delete);

// Rotas de categorias
router.get('/categories', categoryController.index);
router.post('/categories', categoryController.create);
router.get('/categories/:id', categoryController.show);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);

// Rotas de receitas
router.get('/revenues', revenueController.index);
router.post('/revenues', revenueController.create);
router.get('/revenues/:id', revenueController.show);
router.put('/revenues/:id', revenueController.update);
router.delete('/revenues/:id', revenueController.delete);

// Rotas de despesas
router.get('/expenses', expenseController.index);
router.post('/expenses', expenseController.create);
router.get('/expenses/:id', expenseController.show);
router.put('/expenses/:id', expenseController.update);
router.delete('/expenses/:id', expenseController.delete);

// Rota do dashboard
router.get('/dashboard', dashboardController.index);

// Rotas de relatórios
router.get('/reports', reportController.getReportData);
router.get('/reports/export/pdf', reportController.exportPDF);
router.get('/reports/export/excel', reportController.exportExcel);

module.exports = router;
