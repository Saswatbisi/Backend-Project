const User = require('../models/User');

// 🔹 Controller logic for users
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      message: "Fetching users from Database...",
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      users
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getUsers
};