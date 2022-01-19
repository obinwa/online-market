const { 
  User,
  Task,
  ArtisanService,
  Service,
 } = require("../db/models/index");
const { Op } = require("sequelize");
const {
  AppError,
  AppSuccess,
  isToday
} = require("../utils");
const{ 
  paginate
} = require("../helper/service-helper");
const serviceEnum = require("../enums/service-requests-constants")
require("dotenv").config();
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];


exports.getTransactionHistory = async function(userId,{page,pageSize}){
  let user = await User.findByPk(userId);
  if(user.userRole === "artisan") return getArtisanTransactions(user,page,pageSize);
  if(user.userRole === "customer") return getCustomerTransactions(user,page,pageSize);
  if(user.userRole === "admin") return getAdminTransactions(user,page,pageSize);
  return ;
}

async function getAdminTransactions(admin,page,pageSize){
  let {limit,offset} = paginate(page,pageSize);
  let tasks = await Task.findAll({
    where:{
      paymentDate:{[Op.ne]:null} 
    },
    limit,
    offset,
    include: [
      {
        model: ArtisanService,
        required:true,
        include:{
          model:User
        }
      },
      {model:Service},
      {model:User}
    ]
  });

  let transactions = tasks
  .map(task => {
    let paymentStatus = task.paymentStatus;
    let statusParts = paymentStatus.split("In");
    let customerPaymentStatus = "pending";
    let settlementStatus = "pending";
    if(statusParts[2] === "Collection") customerPaymentStatus = statusParts[0];
    if(statusParts[2] === "artisan"){
      customerPaymentStatus = "Paid";
      settlementStatus = statusParts[0];
    }
    let afriserveIncome = task.price * (1-config.paymentRatio);
    let vendorName = `${task.artisanService?.user?.firstName} ${task?.artisanService?.user?.lastName}`;
    let customerName = `${task.user.firstName} ${task.user.lastName}`;

    return {
      customerName,
      serviceName: task?.service.name,
      amount: task.price,
      afriserveIncome,
      vendorName,
      paymentDate: task.paymentDate,
      customerPaymentStatus,
      settlementStatus,
      transferData:task.transferData,
      paymentData:task.paymentData
    }
  });

  return transactions;

}

async function getCustomerTransactions(customer,page,pageSize){
  let {limit,offset} = paginate(page,pageSize);
  let tasks = await Task.findAll({
    where:{
      [Op.and]:[
        {customerId: customer.id },
        {paymentDate:{[Op.ne]:null}}
      ]
    },
    limit,
    offset,
    include: [
      {model: ArtisanService},
      {model:Service},
    ]
  });

  let transactions = tasks
    .map(task => {
      return {
        serviceName: task?.service.name,
        charge: task.price,
        paymentDate: task.paymentDate,
      }
    });

  return transactions;

}

async function getArtisanTransactions(artisan,page,pageSize){
  let {limit,offset} = paginate(page,pageSize);
  let tasks = await Task.findAll(
    { 
      where:{
        [Op.and]:[
          { "$artisanService.userId$":artisan.id },
          {paymentDate:{[Op.ne]:null}}
        ]
      },
      limit,
      offset,
      include: [
        {model: ArtisanService},
        {model:Service},
      ]
    }
  );

  let transactions = tasks
    .map(task => {
      let paymentStatus = task.paymentStatus;
      let statusParts = paymentStatus.split("In");
      let customerPaymentStatus = "pending";
      let artisanSettlementStatus = "pending";
      if(statusParts[2] === "Collection") customerPaymentStatus = statusParts[0];
      if(statusParts[2] === "artisan"){
        customerPaymentStatus = "verified";
        artisanSettlementStatus = statusParts[0];
      }

      return {
        serviceName: task?.service.name,
        charge: task.price,
        paymentDate: task.paymentDate,
        customerPaymentStatus,
        artisanSettlementStatus,
      }
    });

  return transactions;
}

exports.artisanWallet = async function(artisanId){
  let artisan = await User.findByPk(artisanId);
  if(artisan.userRole !== "artisan") throw new AppError().UNAUTHORIZED();

  let tasks = await Task.findAll(
    { 
      where:{
        [Op.and]:[
          { "$artisanService.userId$":artisan.id },
          {paymentDate:{[Op.ne]:null}}
        ]
      },
      include: [
        {model: ArtisanService},
        {model:Service},
      ]
    }
  );

  let todaysBalance = 0;
  let totalEarnings = 0;
  let withdrawablePayment = 0;

  for(let task of tasks) {
    if(task.jobStatus === serviceEnum.CUSTOMER_CONFIRM_JOB.taskStatus){
      totalEarnings = totalEarnings + task.price;
      if(task.paymentStatus === serviceEnum.VERIFIED_IN_ARTISAN){
        withdrawablePayment = withdrawablePayment + task.price;
      }
      if(isToday(task.paymentDate)){
        todaysBalance = todaysBalance + task.price;
      }
    }
    
  }

  return {
    todaysBalance,
    totalEarnings,
    withdrawablePayment,
  }

}


