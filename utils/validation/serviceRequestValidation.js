const Joi = require("joi");

const serviceRequest = Joi.object({
  userId: Joi.number().required(),
  artisanId: Joi.number().required(),
  price: Joi.number().required(),
  serviceName: Joi.string().required(),
  description: Joi.string().required(),
  title: Joi.string().required(),
  dateTime: Joi.string().required().regex(/((?:19|20)[0-9][0-9])-(0?[1-9]|1[012])-([12][0-9]|3[01]|0?[1-9])/),
});

const bookService = Joi.object({
  price: Joi.number().required(),
  serviceName: Joi.string(),
  serviceId: Joi.number().required(),
  description: Joi.string().required(),
  title: Joi.string().required(),
  dateTime: Joi.string().required().regex(/((?:19|20)[0-9][0-9])-(0?[1-9]|1[012])-([12][0-9]|3[01]|0?[1-9]) (\d{2}):(\d{2}):(\d{2})$/),
  location: Joi.string().required(),
  state: Joi.string().required(),
  address: Joi.string().required(),
});

const negotiateRequestSchema = Joi.object({
  taskId:Joi.number().required(),
  newPrice:Joi.number().required(),
  message: Joi.string().required(),
  artisanServiceId: Joi.number(),
});

const acceptRequestSchema = Joi.object({
  taskId:Joi.number().required(),
  artisanServiceId: Joi.number().required(),
});

const serviceSchema = Joi.object({
  primaryServiceId:Joi.number(),
  primaryServicePrice:Joi.number(),
  secondaryServiceId:Joi.number().required(),
  secondaryServicePrice:Joi.number().required(),
});

const reportSchema = Joi.object({
  taskId:Joi.number().required(),
  reporteeId: Joi.number().required(),
  description: Joi.string().required(),
})

module.exports = {
  serviceRequest,
  bookService,
  negotiateRequestSchema,
  serviceSchema,
  acceptRequestSchema,
  reportSchema
};

