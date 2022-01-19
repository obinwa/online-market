const Joi = require("joi");

const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email({ minDomainSegments: 2 }),
  phoneNumber: Joi.string()
    .regex(/^[+234][0-9]{13}/)
    .required(),
  userRole: Joi.string().required(),
  password: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required(),
  serviceId: Joi.string(),
  localGovernment: Joi.string(),
  address: Joi.string(),
  city: Joi.string(),
  state: Joi.string(),
  idImage: Joi.string(),
  proofOfAddress: Joi.string(),
  country: Joi.string(),
  profileImage: Joi.string(),
  price: Joi.string(),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }),
  password: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required(),
  email: Joi.string().email({ minDomainSegments: 2 }),
  otpCode: Joi.number().required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required(),
  newPassword: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required(),
  id: Joi.required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
