const { ValidationError } = require("sequelize");
const validate = new ValidationError();
exports.errorHandler = (err) => {
  console.log(err instanceof validate);
};
