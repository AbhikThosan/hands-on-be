const register = require("./handlers/register");
const login = require("./handlers/login");
const getUsers = require("./handlers/getUsers");
const getProfile = require("./handlers/getProfile");
const updateProfile = require("./handlers/updateProfile");
const updateUserRole = require("./handlers/updateUserRole");
module.exports = {
  register,
  login,
  getUsers,
  getProfile,
  updateProfile,
  updateUserRole,
};
