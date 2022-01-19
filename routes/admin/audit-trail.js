const express = require("express");
const router = express.Router();

const {
  getAuditTrails,
  filterByRoleAuditTrail,
  filterByDateAuditTrail,
  sortByCreatedAtAuditTrail,
} = require("../../controllers/admin/audit-trail");
const {
  verifyToken,
  verifyAdminRole,
  checkIsActivated,
} = require("../../middleware/");

router.get("/", verifyToken, checkIsActivated, verifyAdminRole, getAuditTrails);
router.get(
  "/role",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  filterByRoleAuditTrail
);
router.get(
  "/date",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  filterByDateAuditTrail
);
router.get(
  "/sort",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  sortByCreatedAtAuditTrail
);

module.exports = router;
