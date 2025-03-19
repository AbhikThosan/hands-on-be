const createHelpRequest = require("./handlers/createHelpRequest");
const getHelpRequests = require("./handlers/getHelpRequests");
const getHelpRequestById = require("./handlers/getHelpRequestById");
const addComment = require("./handlers/addComment");
const getCommentsByHelpRequestId = require("./handlers/getCommentsByHelpRequestId");
const updateStatus = require("./handlers/updateStatus");

module.exports = {
  createHelpRequest,
  getHelpRequests,
  getHelpRequestById,
  addComment,
  getCommentsByHelpRequestId,
  updateStatus,
};
