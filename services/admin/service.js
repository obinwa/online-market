const { Service } = require("../../db/models");
const { uploadFile, generateFiveDigits } = require("../../utils/index");
const { Op } = require("sequelize");

exports.getServices = async () => {
  const services = await Service.findAll();
  return services;
};

// exports.searchServiceService = async (search) => {
//   const services = await Service.findAll({
//     where: {
//       name: {
//         [Op.iLike]: `%${search}%`,
//       },
//     },
//   });
//   return services
// }

exports.addToService = async (files, data) => {
  const serviceId = generateFiveDigits()
  const service = await Service.create({ ...data, serviceId });
  let imageKeyPrefix = `${service.name}`;
  for (const key in files) {
    for (const file of files[key]) {
      const { fieldname, url } = await uploadFile(file, imageKeyPrefix);
      service[fieldname] = url.Location;
      await service.save();
    }
  }

  return service;
};

exports.updateService = async (data, id) => {
  const service = await Service.update(data, {
    where: {
      id: id,
    },
  });
  return service;
};

exports.deleteService = async (id) => {
  const service = await Service.findOne({ where: { id } });
  await service.destroy();
  return service;
};

exports.activateServiceService = async (id) => {
  const service = await Service.update(
    { status: true },
    {
      where: {
        id: id,
      },
    }
  );

  return true;
};
exports.deActivateServiceService = async (id) => {
  const service = await Service.update(
    { status: false },
    {
      where: {
        id: id,
      },
    }
  );

  return true;
};
