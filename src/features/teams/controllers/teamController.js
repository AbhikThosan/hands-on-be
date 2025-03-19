const createTeam = require("./handlers/createTeam");
const getTeams = require("./handlers/getTeams");
const joinTeam = require("./handlers/joinTeam");
const getLeaderboard = require("./handlers/getLeaderboard");
const getTeamDashboard = require("./handlers/getTeamDashboard");
const sendTeamInvitation = require("./handlers/sendTeamInvitation");
const respondToInvitation = require("./handlers/respondToInvitation");
const getUserTeams = require("./handlers/getUserTeams");
const getPendingInvitations = require("./handlers/getPendingInvitations");
const getMyCreatedTeams = require("./handlers/getMyCreatedTeams");

module.exports = {
  createTeam,
  getTeams,
  joinTeam,
  getLeaderboard,
  getTeamDashboard,
  sendTeamInvitation,
  respondToInvitation,
  getUserTeams,
  getPendingInvitations,
  getMyCreatedTeams,
};
