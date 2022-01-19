const cron = require("node-cron");

const { deleteExpiredOtps } = require("./jobs");

const schedule = () => {
  cron.schedule("0,30 * * * *", async () => {
    await deleteExpiredOtps();
  });
};
module.exports = schedule;
