const { AuditTrail, User } = require("../../db/models");
const { generateFiveDigits } = require("../../utils");
const { AppSuccess } = require("../../utils/");
const { Op } = require("sequelize");

const formatAudits = (audits) => {
  return audits.rows.map((item) => {
    return {
      ...item.dataValues,
      user: {
        id: item.user.id,
        imageUrl: item.user.profileImageUrl,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
        userRole: item.user.userRole,
        email: item.user.email,
      },
    };
  });
};

const saveAudit = async (userId, type, status, req) => {
  const auditId = generateFiveDigits();

  const audit = new AuditTrail({
    auditId,
    userId,
    activity: type,
    status,
    endpoint: req.originalUrl,
    ip: req.socket.remoteAddress,
    device: req.headers["user-agent"],
  });

  await audit.save();
};

const getAuditTrails = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const audits = await AuditTrail.findAndCountAll({
      include: {
        model: User,
      },
      offset: (page - 1) * limit,
      limit: +limit,
    });
    const data = formatAudits(audits);
    return new AppSuccess(res, {
      data,
      count: audits.count,
    }).FETCHED_SUCCESFULLY();
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const filterByRoleAuditTrail = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const audits = await AuditTrail.findAndCountAll({
      include: {
        model: User,
        where: { userRole: req.query.role },
      },
      offset: (page - 1) * limit,
      limit: +limit,
    });
    const data = formatAudits(audits);
    return new AppSuccess(res, {
      data,
      count: audits.count,
    }).FETCHED_SUCCESFULLY();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const filterByDateAuditTrail = async (req, res, next) => {
  console.log(new Date(req.query.date));
  try {
    const { page, limit } = req.query;

    const audits = await AuditTrail.findAndCountAll({
      where: {
        createdAt: {
          [Op.lte]: new Date(req.query.date),
        },
      },
      include: {
        model: User,
      },
      offset: (page - 1) * limit,
      limit: +limit,
    });
    const data = formatAudits(audits);
    return new AppSuccess(res, {
      data,
      count: audits.count,
    }).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const sortByCreatedAtAuditTrail = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const audits = await AuditTrail.findAndCountAll({
      order: [["createdAt", "DESC"]],
      include: {
        model: User,
      },
      offset: (page - 1) * limit,
      limit: +limit,
    });
    const data = formatAudits(audits);
    return new AppSuccess(res, {
      data,
      count: audits.count,
    }).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveAudit,
  getAuditTrails,
  filterByRoleAuditTrail,
  filterByDateAuditTrail,
  sortByCreatedAtAuditTrail,
};
