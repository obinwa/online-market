const express = require("express");
const router = express.Router();
const {
  verifyPayment,
  artisanAcceptRequest,
  customerConfirmJobDone,
  verifyTransfer

} = require("../controllers/service-request");


/* GET home page. */
router.post("/verify",verifyPayment );

////router.post("/verify/transfer",verifyTransfer);


module.exports = router;