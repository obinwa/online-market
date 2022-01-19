const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_KEY);

exports.mailer = async (config) => {
  try {
    const res = await sgMail.send({ ...config });
    return res;
  } catch (error) {
    return error;
  }
};
