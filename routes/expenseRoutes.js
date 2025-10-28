const express = require('express');
const { addExpense, getExpenses, getExpenseById, getExpenseStats, updateExpense, deleteExpense, getExpenseSummary } = require('../controllers/expenseController');
const { validateExpense, validateExpenseUpdate } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/expenses - Add new expense
router.post('/', protect, validateExpense, addExpense);

// GET /api/expenses - Get all expenses for user with filtering and pagination
router.get('/', protect, getExpenses);

// GET /api/expenses/stats - Get expense statistics
router.get('/stats', protect, getExpenseStats);

// GET /api/expenses/summary - Get all expenses with category totals
router.get('/summary', protect, getExpenseSummary);

// GET /api/expenses/:id - Get single expense by ID
router.get('/:id', protect, getExpenseById);

// PUT /api/expenses/:id - Update expense by ID
router.put('/:id', protect, validateExpenseUpdate, updateExpense);

// DELETE /api/expenses/:id - Delete expense by ID
router.delete('/:id', protect, deleteExpense);

module.exports = router;