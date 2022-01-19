
const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
  AccountDetails,
  Task,
  Review,
  Notification,
  TaskBid,
  Device,
  sequelize
} = require("../db/models/index");
const {AppError,
  AppSuccess,
} = require("../utils");

exports.verifyService = async function(serviceId){
  let service = await Service.findByPk(serviceId);
  if(!service){
    throw new AppError().GENERIC_ERROR("Service not found");
  }
  return service.name;
}

//pass a list, page, and pageSize
exports.paginate = function(page,pageSize){
  if(!isPositiveInteger(page)[0] || !isPositiveInteger(pageSize)[0]){
    console.log(isPositiveInteger(page));
    console.log(isPositiveInteger(pageSize));
    throw new AppError().GENERIC_ERROR("Invalid pagination value");
  }

  let endIndex = page * pageSize;
  let startIndex = endIndex - pageSize ;
  console.log(`page => ${page}, pageSize => ${pageSize}, offset => ${startIndex}`);
  return {
    offset: startIndex,
    limit: +pageSize
  }
}

function isPositiveInteger(value){
  if(!value) return [false,"Null or undefined"];
  if(!Number.isInteger(+value)) return [false,`${value} is not an integer`];
  if(value <= 0) return [false,"Not positive integer"];
  return [true,"All checks passed"];
}

