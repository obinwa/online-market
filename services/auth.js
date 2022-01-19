const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
} = require("../db/models/index");

const {
  AppError,
  verifyAccessToken,
  verifyPassword,
  hashPassword,
  saveFileAndGetUrl,
  uploadFile,
  generateFiveDigits,
  verifyRefreshToken,
} = require("../utils");
const {
  verifyService
} = require("../helper/service-helper");
const { generateOTP } = require("../utils/otpgenerator");
const { Op } = require("sequelize");

const client = require("../connect/redis");
// Registration Service
exports.registerService = async (files, data) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    userRole,
    address,
    localGovernment,
    city,
    state,
    country,
    price,
    serviceId,
  } = data;

  if (
    !firstName?.trim() ||
    !lastName?.trim() ||
    !email?.trim() ||
    !phoneNumber?.trim()
  ) {
    throw Error("Biodata cannot contain empty values. Please enter valid");
  }


  const userExist = await User.findOne({ where: { email } });

  if (userExist && userExist.registrationStatus === "pending") {
    return userExist;
  }
  if (userExist && userExist.registrationStatus === "completed") {
    throw new AppError().EMAIL_ALREADY_EXISTS();
  }

  if (userExist && userExist.registrationStatus === "blocked") {
    throw new AppError().GENERIC_ERROR("User is blocked");
  }

  const userId = generateFiveDigits();

  if (
    userRole.toLowerCase() === "customer" ||
    userRole.toLowerCase() === "admin"
  ) {
    let newUser = await User.create({
      userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      userRole: userRole.trim(),
      approvalStatus: "approved",
    });

    newUser.password = await hashPassword(password);
    if (userRole.toLowerCase() === "customer") {
      const admins = await User.findAll({
        where: { userRole: "admin", isCustomerNotify: true },
      });
    }
    await newUser.save();
    return newUser;
  }
  if (userRole.toLowerCase() === "artisan") {
    await verifyService(serviceId);

    let newUser = await User.create({
      userId: userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      userRole: userRole.trim(),
      registrationStatus: "pending",
    });

    let imageKeyPrefix = `${firstName}-${lastName}`;

    for (const key in files) {
      for (const file of files[key]) {
        const { fieldName, url } = await uploadFile(file, imageKeyPrefix);
        newUser[fieldName] = url.Location;
      }
    }

    await newUser.addLocation(address, localGovernment, city, state, country);
    await newUser.addArtisanService(price, "naira", serviceId);
    newUser["profileCompletion"]["profile"] = "added";
    newUser.password = await hashPassword(password);
    await newUser.save();
    return newUser;
  }
};

exports.verifyOtpService = async (otp) => {
  const userOtp = await Otp.findOne({
    where: { otpDigits: otp },
  });
  if (!userOtp) throw new AppError().INVALID_OTP();

  if (userOtp.expiresIn < Date.now()) throw new AppError().EXPIRED_OTP();

  const user = await User.findByPk(userOtp.userId);
  if (!user) throw new AppError().INVALID_OTP();

  if (userOtp.otpType === "PENDING_REGISTRATION") {
    user.registrationStatus = "completed";
    user.lastLoginDate = new Date();
    await user.save();
  }
  await userOtp.destroy({ truncate: true, restartIdentity: true });
  const payload = {
    id: user.id,
    role: user.userRole,
    email: user.email,
    isActivated: user.isActivated,
  };
  return { payload, type: userOtp.otpType };
};

// Login Services

exports.loginService = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password)))
    throw new AppError().INCORRECT_DETAILS();

  if (user.registrationStatus === "blocked")
    throw new AppError().USER_BLOCKED();
  if (!user.isActivated) throw new AppError().DEACTIVATED();
  if (user.registrationStatus === "pending" && user.userRole === "artisan") {
    return {
      payload: user,
      status: "pending",
    };
  }

  if (
    user.registrationStatus === "completed" &&
    user.userRole === "customer" &&
    user.regType === "facebook"
  )
    throw new AppError().USER_REGISTER_MODE("Faecbook");

  // update user last login date

  user.lastLoginDate = new Date();
  await user.save();


  const payload = {
    id: user.id,
    role: user.userRole,
    email: user.email,
    isActivated: user.isActivated,
    name: `${user.firstName} ${user.lastName}`,
    userId: user.userId,
  };

  return { status: "login", payload };
};

exports.forgotPasswordService = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError().USER_NOT_FOUND();
  return user;
};

exports.resetPasswordService = async (email, password, otpCode) => {
  console.log(otpCode);
  if (!otpCode) throw new AppError().INVALID_OTP()
  const user = await User.findOne({ where: { email } });

  if (!user) throw new AppError().USER_NOT_FOUND();

  if (await verifyPassword(password, user.password))
    throw new AppError().PASSWORD_MATCH();

  user.password = await hashPassword(password);
  // await user.hashPassword(password);
  await user.save();

  if (user.registrationStatus === "pending") {
    return {
      payload: user,
      status: "pending",
    };
  }
  const payload = {
    id: user.id,
    role: user.userRole,
    email: user.email,
    isActivated: user.isActivated,
  };
  return { status: "login", payload };
};

exports.resendOtpService = async (email, otpType) => {
  // console.log(otpType);
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError().USER_NOT_FOUND();
  const otpExists = await Otp.findAll({
    where: {
      [Op.and]: [{ userId: user.id }, { otpType: otpType }],
    },
  });
  if (otpExists.length > 0) {
    await otpExists.forEach(
      async (item) =>
        await item.destroy({ truncate: true, restartIdentity: true })
    );
  }

  return user;
};

exports.refreshTokenService = async (refreshToken, id) => {
  const decoded = await verifyRefreshToken(refreshToken);
  if (
    decoded &&
    decoded.name !== "JsonWebTokenError" &&
    decoded.name !== "TokenExpiredError"
  ) {
    if (id !== decoded.id) {
      throw new AppError().INVALID_TOKEN();
    }

    const payload = {
      id: decoded.id,
      role: decoded.userRole,
      email: decoded.email,
      isActivated: decoded.isActivated,
      name: decoded.name,
      userId: decoded.userId,
      role: decoded.role,
    };
    return payload;
  } else {
    throw new AppError().EXPIRED_TOKEN();
  }
};

exports.registerByFacebookService = async (profile) => {
  const userExist = await User.findOne({ where: { email: profile.email } });
  if (userExist && userExist.registerType === "email")
    throw new AppError().USER_REGISTER_MODE();
  if (!userExist) {
    const userId = generateFiveDigits();

    const user = User.create({
      userId,
      firstName: profile.firstname,
      lastName: profile.lastname,
      email: profile.email,
      phoneNumber: profile.phone,
      approvalStatus: "approved",
      registerType: "facebook",
      userRole: profile.role,
    });

    const payload = {
      id: user.id,
      role: user.userRole,
      email: user.email,
      isActivated: user.isActivated,
      name: `${user.firstName} ${user.lastName}`,
      userId: user.userId,
    };
    return { status: "login", payload };
  } else {
    const payload = {
      id: userExist.id,
      role: userExist.userRole,
      email: userExist.email,
      isActivated: userExist.isActivated,
      name: `${userExist.firstName} ${userExist.lastName}`,
      userId: userExist.userId,
    };
    return { status: "login", payload };
  }
};

exports.changePasswordService = async (data, id) => {
  const { oldPassword, newPassword } = data;

  const user = await User.findOne({ where: { id } });
  console.log(user);

  if (!(await verifyPassword(oldPassword, user.password)))
    throw new AppError().INCORRECT_DETAILS();
  user.password = await hashPassword(newPassword);
  await user.save();
  return true;
};
