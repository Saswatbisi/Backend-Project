// 🔹 Controller logic for users

const getUsers = (req, res) => {
  res.json({
    message: "Fetching all users from Database...",
    users: [
      { id: 1, name: "Alice", status: "Active" },
      { id: 2, name: "Bob", status: "Away" },
      { id: 3, name: "Charlie", status: "Offline" }
    ]
  });
};

module.exports = {
  getUsers
};