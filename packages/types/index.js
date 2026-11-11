"use strict";

/**
 * flowCTRL Shared Constants and Enums
 */

const USER_ROLES = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
});

const WORK_MODES = Object.freeze({
  REMOTE: "REMOTE",
  HYBRID: "HYBRID",
  ONSITE: "ONSITE",
});

const APPLICATION_STATUSES = Object.freeze({
  APPLIED: "APPLIED",
  SCREENING: "SCREENING",
  INTERVIEWING: "INTERVIEWING",
  OFFERED: "OFFERED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
});

module.exports = {
  USER_ROLES,
  WORK_MODES,
  APPLICATION_STATUSES,
};
