const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  searchAllUsers,
  getUserProfile,
  disapproveUser,
  deactivateUser,
  approveArtisan,
  activateUser,
  getCustomerServiceHistory,
  getArtisanServiceHistory,
  getPendingSettlements,
  getOngoingTasks,
  getAdminStatistics
} = require("../../controllers/admin/user");
let { 
  getTransactionHistory
} = require("../../controllers/transaction");

const {
  verifyToken,
  verifyAdminRole,
  checkIsActivated,
} = require("../../middleware/");

router.get(
  "/users",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getAllUsers
);
router.get(
  "/users/search",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  searchAllUsers
);
router.get(
  "/users/single/:id",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getUserProfile
);
router.put(
  "/users/approve",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  approveArtisan
);
router.put(
  "/users/disapprove",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  disapproveUser
);
router.put(
  "/users/reactivate",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  activateUser
);
router.put(
  "/users/deactivate",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  deactivateUser
);

router.get(
  "/users/transaction-history",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getTransactionHistory
);

router.get(
  "/customer/service-history",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getCustomerServiceHistory
);

router.get(
  "/artisan/service-history",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getArtisanServiceHistory
);

router.get(
  "/settlement/pending",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getPendingSettlements
);

router.get(
  "/task/ongoing",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getOngoingTasks
);

router.get(
  "/statistics",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getAdminStatistics
);




module.exports = router;
