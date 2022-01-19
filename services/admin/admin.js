const {
  generateAccessToken,
  mailer,
  AppError,
  verifyAccessToken,
  hashPassword,
  generateFiveDigits,
  verifyPassword,
  uploadFile,
} = require("../../utils/index");
const { User, Service, Task } = require("../../db/models/index");
const { Op } = require("sequelize");


exports.addUserService = async (data) => {
  const { email } = data;
  console.log(email);
  const token = await generateAccessToken(data);

  const url = `localhost:8080/adduser/verify?token=${token}&email=${email}`;

  const config = {
    from: process.env.FROM,
    to: email,
    subject: "You have been invited",
    html: `<p>This is your URL</p><p>${url}</p>`,
  };
  const sendMail = await mailer(config);
  return url;
};

exports.acceptInviteService = async ({ email, token }, { password }) => {
  const userExists = await User.findOne({ where: { email } });
  if (userExists) throw new AppError().EMAIL_ALREADY_EXISTS();

  const decoded = await verifyAccessToken(token);
  if (!decoded) throw new AppError().UNVERIFIED_TOKEN();
  if (decoded && decoded.name === "TokenExpiredError")
    throw new AppError().EXPIRED_TOKEN();
  if (decoded && decoded.name === "JsonWebTokenError")
    throw new AppError().UNVERIFIED_TOKEN();
  if (decoded.email !== email) throw new AppError().UNVERIFIED_TOKEN();
  const userId = await generateFiveDigits();
  console.log(userId);
  const user = await User.create({
    firstName: decoded.firstName.trim(),
    lastName: decoded.lastName,
    phoneNumber: decoded.phoneNumber,
    password: password,
    email: decoded.email.trim(),
    registrationStatus: "completed",
    approvalStatus: "approved",
    userRole: "admin",
    userId,
  });
  user.password = await hashPassword(password);
  await user.save();

  const payload = {
    id: user.id,
    role: user.userRole,
    email: user.email,
    isActivated: user.isActivated,
    name: `${user.firstName} ${user.lastName}`,
  };
  return payload;
};

exports.updateAdminService = async (id, files, data) => {
  const user = await User.update({ ...data }, { where: { id } });
  const updatedUser = await User.findOne({ where: { id } });
  // console.log(updatedUser);

  let imageKeyPrefix = `${data.firstName}-${data.lastName}`;
  if (files) {
    for (const key in files) {
      for (const file of files[key]) {
        const { fieldname, url } = await uploadFile(file, imageKeyPrefix);
        updatedUser[fieldname] = url.Location;
        await updatedUser.save();
      }
    }
  }

  return updatedUser;
};

exports.getAdminService = async (id) => {
  return await User.findOne({ where: { id, userRole: "admin" } });
};

exports.deactivateAccountService = async (id) => {
  const user = await User.findOne({ where: { id } });
  user.isActivated = false;
  await user.save();
  return true;
};

exports.activateAccountService = async (id) => {
  const user = await User.findOne({ where: { id } });
  user.isActivated = true;
  await user.save();
  return true;
};

exports.getTeamMembersService = async () => {
  const team = await User.findAll({ where: { userRole: "admin" } })
  return team
}

exports.getStatsService = async () => {

  const totalCustomer = await User.findAll({ where: { userRole: "customer" } });
  const totalArtisan = await User.findAll({ where: { userRole: "artisan" } });
  const getCustomerWithinAWeek = new Date();
  getCustomerWithinAWeek.setDate(getCustomerWithinAWeek.getDate() + 7);
  const totalCustomerWithinAWeek = await User.findAll({ where: { userRole: "customer", createdAt: { [Op.lte]: getCustomerWithinAWeek } } });
  const artisanPendingApproval = await User.findAll({ where: { userRole: "artisan", approvalStatus: "pending" } });
  const stats = {
    totalCustomer: totalCustomer.length,
    totalArtisan: totalArtisan.length,
    totalCustomerWithinAWeek: totalCustomerWithinAWeek.length,
    totalArtisanPendingApproval: artisanPendingApproval.length,

  }
  return stats
}
exports.getCompeletedRequestsService = async () => {


  const services = await Service.findAll({});
  const serviceCount = []
  await services.forEach(async item => {
    const { count } = await Task.findAndCountAll({ where: { serviceId: item.id, jobStatus: "completed" } });
    // return {
    //   service: item.name,
    //   count: count
    // };
    console.log(count)
    serviceCount.push({
      service: item.name,
      count: count
    })
  })
  console.log(await serviceCount)
  return await serviceCount
}