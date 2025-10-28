const Expense = require('../models/expenseModel');
const { validationResult } = require('express-validator');

// @desc    Add new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { title, amount, category, date } = req.body;

        // Create expense
        const expense = await Expense.create({
            title,
            amount: parseFloat(amount),
            category,
            date: date || new Date(),
            user: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Expense added successfully',
            data: expense
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all expenses for user with filtering and pagination
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const { category, startDate, endDate, page = 1, limit = 10 } = req.query;

        // Build filter object
        const filter = { user: req.user._id };

        // Add category filter if provided
        if (category) {
            filter.category = category;
        }

        // Add date range filter if provided
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) {
                filter.date.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.date.$lte = new Date(endDate);
            }
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get expenses with pagination
        const expenses = await Expense.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination
        const totalExpenses = await Expense.countDocuments(filter);
        const totalPages = Math.ceil(totalExpenses / limitNum);

        res.status(200).json({
            success: true,
            message: 'Expenses retrieved successfully',
            data: expenses,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalExpenses,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single expense by ID (View Details)
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findOne({
            _id: req.params.id,
            user: req.user._id
        }).select('title amount category date');

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Format the response to show only required fields
        const expenseDetails = {
            id: expense._id,
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            date: expense.date
        };

        res.status(200).json({
            success: true,
            message: 'Expense details retrieved successfully',
            data: expenseDetails
        });

    } catch (error) {
        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get expense statistics for user
// @route   GET /api/expenses/stats
// @access  Private
const getExpenseStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = { user: req.user._id };
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) {
                dateFilter.date.$gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.date.$lte = new Date(endDate);
            }
        }

        // Get total expenses and amount
        const totalStats = await Expense.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalExpenses: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);

        // Get expenses by category
        const categoryStats = await Expense.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // Get monthly expenses (last 6 months)
        const monthlyStats = await Expense.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 6 }
        ]);

        res.status(200).json({
            success: true,
            message: 'Expense statistics retrieved successfully',
            data: {
                total: totalStats[0] || { totalAmount: 0, totalExpenses: 0, avgAmount: 0 },
                byCategory: categoryStats,
                monthly: monthlyStats
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update expense by ID
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { title, amount, category, date } = req.body;

        // Find expense by ID and user
        const expense = await Expense.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Update expense fields
        expense.title = title || expense.title;
        expense.amount = amount ? parseFloat(amount) : expense.amount;
        expense.category = category || expense.category;
        expense.date = date ? new Date(date) : expense.date;

        // Save updated expense
        const updatedExpense = await expense.save();

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            data: {
                id: updatedExpense._id,
                title: updatedExpense.title,
                amount: updatedExpense.amount,
                category: updatedExpense.category,
                date: updatedExpense.date
            }
        });

    } catch (error) {
        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete expense by ID
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    try {
        // Find expense by ID and user
        const expense = await Expense.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Delete the expense
        await Expense.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully',
            data: {
                deletedExpense: {
                    id: expense._id,
                    title: expense.title,
                    amount: expense.amount,
                    category: expense.category,
                    date: expense.date
                }
            }
        });

    } catch (error) {
        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all expenses with category totals for user
// @route   GET /api/expenses/summary
// @access  Private
const getExpenseSummary = async (req, res) => {
    try {
        // Get all expenses for the logged-in user
        const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });

        // Calculate total amount spent per category
        const categoryTotals = {};
        let totalAmount = 0;

        expenses.forEach(expense => {
            const category = expense.category;
            const amount = expense.amount;

            // Add to category total
            if (categoryTotals[category]) {
                categoryTotals[category] += amount;
            } else {
                categoryTotals[category] = amount;
            }

            // Add to overall total
            totalAmount += amount;
        });

        // Convert categoryTotals object to array for better JSON structure
        const categoryBreakdown = Object.keys(categoryTotals).map(category => ({
            category: category,
            totalAmount: parseFloat(categoryTotals[category].toFixed(2)),
            percentage: parseFloat(((categoryTotals[category] / totalAmount) * 100).toFixed(2))
        })).sort((a, b) => b.totalAmount - a.totalAmount); // Sort by amount descending

        res.status(200).json({
            success: true,
            message: 'Expense summary retrieved successfully',
            data: {
                totalExpenses: expenses.length,
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                categoryBreakdown: categoryBreakdown,
                expenses: expenses.map(expense => ({
                    id: expense._id,
                    title: expense.title,
                    amount: expense.amount,
                    category: expense.category,
                    date: expense.date
                }))
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    addExpense,
    getExpenses,
    getExpenseById,
    getExpenseStats,
    updateExpense,
    deleteExpense,
    getExpenseSummary
};