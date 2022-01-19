const { Otp } = require("../db/models");

const deleteExpiredOtps = async () => {
  const expiredOtps = await Otp.find({
    expiresIn: { $lt: new Date() },
  });
  if (expiredOtps) {
    await Otp.deleteMany({
      id: { $in: expiredOtps.map((otp) => otp.id) },
    });
  }
};

module.exports = {
  deleteExpiredOtps,
};
