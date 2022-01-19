const otpgenerator = require("otp-generator");
const { addMinutesToDate } = require("./addMinuteToDate");
const { Otp, User } = require("../db/models/index");
const AppError = require("./appError");
const { generateAccessToken } = require("./token");
const { Op } = require("sequelize");
const { sendSMS } = require("./message/sms");
const { mailer } = require("./message/mailer");
require("dotenv").config();

exports.generateOTP = async (email, type, userId, emailtype) => {
  const otpExists = await Otp.findAll({
    where: {
      [Op.and]: [{ userId }, { otpType: type }],
    },
  });

  if (otpExists.length > 0) {
    await otpExists.forEach(
      async (item) =>
        await item.destroy({ truncate: true, restartIdentity: true })
    );
  }
  const otp = otpgenerator.generate(5, {
    digits: true,
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });

  const now = new Date();
  const expiresIn30 = addMinutesToDate(now, 30);
  const newOTP = await Otp.create({
    expiresIn: expiresIn30,
    otpType: type,
    userId: userId,
    otpDigits: otp,
  });

  const details = {
    email,
    otpID: newOTP.id,
  };

  const config = {
    from: process.env.FROM,
    to: email,
    subject: emailtype,
    html: `<p>This is your OTP</p><p>${otp}</p>`,
  };
  await mailer(config);
  return true;
};

exports.generateOTPForSMS = async function (
  phoneNumber,
  type,
  userId,
  messageType
) {
  let previousUser = await User.findOne({
    where: {
      phoneNumber,
    },
  });

  if (previousUser && previousUser.id !== userId) {
    throw new AppError().PHONE_ALREADY_EXISTS();
  }

  const otpExists = await Otp.findAll({
    where: {
      [Op.and]: [{ userId }, { otpType: type }],
    },
  });

  if (otpExists.length > 0) {
    await otpExists.forEach(
      async (item) =>
        await item.destroy({ truncate: true, restartIdentity: true })
    );
  }
  const otp = otpgenerator.generate(5, {
    digits: true,
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });

  const now = new Date();
  const expiresIn = now.setHours(now.getHours() + 2);
  const newOTP = await Otp.create({
    expiresIn,
    otpType: type,
    userId: userId,
    otpDigits: otp,
    newPhoneNumber: phoneNumber,
  });

  const details = {
    phoneNumber,
    otpID: newOTP.id,
  };

  const encoded = await generateAccessToken(details);
  const dataInfo = {
    encoded,
    otpType: type,
    phoneNumber,
  };

  let message = `This is your OTP ${otp}`;
  await sendSMS(phoneNumber, message);

  let user = await User.findByPk(userId);
  user.newPhoneNumber = phoneNumber;
  await user.save();

  const config = {
    from: process.env.FROM,
    to: user.email,
    subject: messageType,
    html: `<p>This is your OTP</p><p>${otp}</p>`,
  };
  let mailResponse = await mailer(config);
  console.log(mailResponse);
  return dataInfo;
};
