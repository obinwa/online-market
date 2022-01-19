  exports.validateSchema = (schema) => (req, res, next) => {
  const { error, value } = schema.validate({
    ...req.body,
    ...req.params,
    ...req.query,
  });

  if (error) {
    return error.details.forEach((e) => {
      const str = e.message.substring(
        e.message.indexOf('"') + 1,
        e.message.lastIndexOf('"')
      );

      res.status(400).json({
        status: false,
        message: error.message.replace(/['"]/g, ""),
        data: null,
      });
    });
  }

  next();
};
