const { User, Location,Task,Review,ArtisanService } = require("../../db/models");
const { Op } = require("sequelize");
const { saveAudit } = require("../../controllers/admin/audit-trail");
const {
  AppError,
  difference
} = require("../../utils");

require("dotenv").config();
const env = process.env.NODE_ENV || "development";
const config = require("../../config/config")[env];

const findOneUser = async (id, userRole) => {
  const user = await User.findOne({ where: { userRole, id } });
  return user;
};

exports.artisanServiceHistory = async function(userId){
  if(!userId) throw new AppError().GENERIC_ERROR("Invalid credentials");
  let user = await User.findOne({
    where:{ 
      id: userId
    }, 
    include: {
      model: ArtisanService
    }
  });


  if(!user) throw new AppError().GENERIC_ERROR(" Invalid credentials");

  let tasks = [];
  if(user.userRole === "artisan") {
    tasks = await Task.findAll({
      where:{
        [Op.and]:[
          {"$artisanService.user.id$":userId},
          {[Op.not]:{
            paymentDate:null
          }},
        ]
      },
      include:[
        {
          model: ArtisanService,
          required:true,
          include:{
            model:User
          }
        },
        {
          model: Review
        },
        { 
          model:User
        }
      ],
    });
  }
  else{
    throw new AppError().GENERIC_ERROR("An error ocurred while processing customer history")
  }

  let reviews = [];
  let artisanServiceHistory = tasks.map(function(task){
    reviews.push(task.review);
    let data = {
      taskId: reviews.length + 1421,
      service: task.serviceName,
      customer: `${task.user.firstName} ${task.user.lastName}`,
      charge: task.price,
      status: getStatus(task.jobStatus),
      date: task.completionTime,
      id: task.id,
    }
    return data;
  });

  let scheduledJobsStatus = [ "accepted", "artisanArrived"];
  let scheduledJobs = tasks.map(function(task){
    let taskStatus = task.jobStatus.trim();
    if(scheduledJobsStatus.includes(taskStatus)){
      return task;
    }
  });

  let earnings = getEarnings(tasks);

  return { 
    history: artisanServiceHistory,
    reviews: reviews.filter(review => review),
    customer:user,
    ...earnings,
    completedTaskCount:getTaskCounts(tasks),
    scheduledJobs:scheduledJobs.filter(task=>task)
  }
}

function getEarnings(tasks) {
  let totalEarnings = 0;

  for (let task of tasks) {
    if (task.jobStatus === "customerConfirmed") {
      totalEarnings = totalEarnings + task.price;
    }
  }

  let paymentRatio = 1 - parseFloat(config.paymentRatio);
  let commission = Number(totalEarnings * paymentRatio).toFixed(2);
  
  return {
    totalEarnings,
    commission,
  }
}

function getTaskCounts(tasks) {
  let completedTaskCount = 0;

  let stopped = ["customerCancelled","artisanRejected","jobDispute"];
  let active = ["accepted","artisanArrived","started"];
  let completed = ["completed","customerConfirmed"];
  for (let task of tasks) {
    if (completed.includes(task.jobStatus.trim())) completedTaskCount++;
  }

  return completedTaskCount;
}

exports.customerServiceHistory = async function(userId){
  if(!userId) throw new AppError().GENERIC_ERROR("Invalid credentials");
  let user = await User.findByPk(userId);
  if(!user) throw new AppError().GENERIC_ERROR(" Invalid credentials");

  let tasks = [];
  if(user.userRole === "customer") {
    tasks = await Task.findAll({
      where:{
        [Op.and]:[
          {customerId:userId},
          {[Op.not]:{
            paymentDate:null
          }}
        ]
      },
      include:[
        {
          model: ArtisanService,
          required:true,
          include:{
            model:User
          }
        },
        {
          model: Review
        }
      ],
    });
  }
  else{
    throw new AppError().GENERIC_ERROR("An error ocurred while processing customer history")
  }

  let reviews = [];
  let customerServiceHistory = tasks.map(function(task){
    reviews.push(task.review);
    let data = {
      taskId: reviews.length + 1061,
      service: task.serviceName,
      artisan: `${task.artisanService.user.firstName} ${task.artisanService.user.lastName}`,
      charge: task.price,
      status: getStatus(task.jobStatus),
      date: task.completionTime,
      id: task.id,
    }
    return data;
  });

  return { 
    history: customerServiceHistory,
    reviews: reviews.filter(review => review),
    customer:user
  }
}

function getStatus(jobStatus){
  let stopped = ["customerCancelled","artisanRejected","jobDispute"];
  let active = ["accepted","artisanArrived","started"];
  let completed = ["completed","customerConfirmed"];

  if(stopped.includes(jobStatus)) return "Stopped";
  else if(active.includes(jobStatus)) return "Active";
  else if(completed.includes(jobStatus)) return "Completed";
  else return "Processing";
}


exports.getAllUsersService = async ({ page, limit, location, ...data }) => {
  // const { id } = await Location.findOne({ where: { name: location } });
  if (location) {
    const allUsers = await User.findAll(
      {
        where: {
          ...data,
        },
        include: {
          model: Location,
          where: { state: location || "" },
        },
      },
      { offset: (page - 1) * limit, limit: limit }
    );
    return allUsers;
  } else {
    const allUsers = await User.findAll(
      {
        where: {
          ...data,
        },
      },
      { offset: (page - 1) * limit, limit: limit }
    );
    return allUsers;
  }
};

exports.searchAllUsersService = async (role, search) => {
  const allUsers = await User.findAll({
    where: {
      userRole: role,
      [Op.or]: [
        { email: search },
        { firstName: search },
        { lastName: search },
        { phoneNumber: search },
        // { artisanId: search },
      ],
    },
  });

  return allUsers;
};

exports.getUserProfileService = async (id, userRole) => {
  const user = await findOneUser(id, userRole);
  return user;
};

exports.approveArtisanService = async (id, userRole, admin) => {
  if (typeof id === "object") {
    id.forEach(async (item) => {
      const user = await findOneUser(item, userRole);
      user.approvalStatus = "approved";

      await user.save();
    });

    return "group";
  } else {
    const user = await findOneUser(id, userRole);
    user.approvalStatus = "approved";
    await user.save();
    return "single";
  }
};

exports.disapproveArtisanService = async (id, userRole, admin) => {
  if (typeof id === "object") {
    id.forEach(async (item) => {
      const user = await findOneUser(item, userRole);
      user.approvalStatus = "declined";
      await user.save();
    });
    return "group";
  } else {
    const user = await findOneUser(id, userRole);
    user.approvalStatus = "declined";
    await user.save();
    return "single";
  }
};

exports.deactivateUserService = async (id, userRole, admin) => {
  if (typeof id === "object") {
    id.forEach(async (item) => {
      const user = await findOneUser(item, userRole);
      user.isActivated = false;

      await user.save();
    });
    return "group";
  } else {
    const user = await findOneUser(id, userRole);
    user.isActivated = false;

    await user.save();
    return "single";
  }
};

exports.activateUserService = async (id, userRole, admin) => {
  if (typeof id === "object") {
    id.forEach(async (item) => {
      const user = await findOneUser(item, userRole);
      user.isActivated = true;

      await user.save();
    });
    return "group";
  } else {
    const user = await findOneUser(id, userRole);
    user.isActivated = true;
    await user.save();
    return "single";
  }
};

async function getPendingPaymentTasks(){
  let pendingSettlementTasks = await Task.findAll({
    where:{
      paymentStatus:{
        [Op.in]:["pendingInArtisan","failedInArtisan"]
      }
    },
    include:{
      model:ArtisanService,
      include:{ 
        model:User
      }
    }
  });

  return pendingSettlementTasks;
}

exports.pendingSettlement = async () => {
  
  let pendingSettlementTasks = await getPendingPaymentTasks();
  let pendingSettlements = pendingSettlementTasks.map(task =>{
    let id = 1235 + task.id;
    return {
      orderNumber:`NIN${id}`,
      vendor: `${task.artisanService.user.firstName} ${task.artisanService.user.lastName}`,
      amount: task.price,
      status: task.paymentStatus?.split("In")[0]
    }
  });

  return pendingSettlements;
}

async function getOngoingTasks(){
  let ongoingTasks = await Task.findAll({
    where:{
      jobStatus:{
        [Op.in]:["accepted","artisanArrived","started"]
      }
    },
    include:[
      {
        model:ArtisanService,
        include:{ 
          model:User
        }
      },
      {model:User}
    ]
  });

  return ongoingTasks;
}

exports.ongoingTasks = async () => {
  return getOngoingTasks();
}

exports.adminStatistics = async function(){
  let ongoingTasks = await getOngoingTasks();
  let ongoingTaskAmount = ongoingTasks.reduce(getSum,0);

  let pendingSettlements = await getPendingPaymentTasks();
  let pendingSettlementAmount = pendingSettlements.reduce(getSum,0);

  let vendors = await getUsers(["artisan"]);
  let vendorCount = vendors.length;

  let customers = await getUsers(["customer"]);
  let customerCount = customers.length;

  let users = await getUsers(["customer","artisan","admin"]);
  let userCount = users.length;

  let newCustomersThisWeek = customers.map(function(customer){
    let currentDate = new Date();
    if(Math.abs(difference(currentDate,customer.createdAt,"d" )) <= 7){
      return customer;
    }
  }).filter(customer => customer);
  let newCustomersThisWeekCount = newCustomersThisWeek.length;

  let artisanPendingApproval = vendors.map(function(vendor){
    if(vendor.approvalStatus === "pending") return vendor;
  }).filter(vendor => vendor);
  let artisanPendingApprovalCount = artisanPendingApproval.length;

  let lastYearTasks = await getLastYearTasks();
  let taskAmountLastYear = lastYearTasks.reduce(function(total,task){
    return total + task.price;
  },0);

  let allTasks = await getAllPaidTasks();
  let allTaskAmount = allTasks.reduce(function(total,task){
    return total + task.price;
  },0);

  let afriserveAmount = allTasks.reduce(function(total,task){
    return total + task.afriserveAmount;
  },0);

  return {
    ongoingTaskAmount,
    pendingSettlementAmount,
    vendorCount,
    customerCount,
    userCount,newCustomersThisWeekCount,
    artisanPendingApprovalCount,
    taskAmountLastYear,
    allTaskAmount,
    afriserveAmount,
  }


}

async function getLastYearTasks(){
  var oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() - 1);
  let tasks = await Task.findAll({
    where:{
      [Op.and]:[
        {paymentStatus: "verifiedInArtisan"},
        {paymentDate:{[Op.ne]:null}},
        {paymentDate:{[Op.gte]: oneYearFromNow}}
      ]     
    }
  });

  return tasks;
}

async function getAllPaidTasks(){
  let tasks = await Task.findAll({
    where:{
      [Op.and]:[
        {paymentStatus: "verifiedInArtisan"},
        {paymentDate:{[Op.ne]:null}, }
      ]  
    }
  });

  return tasks;
}

async function getUsers(typeArray){

  let users = await User.findAll({
    where: {
      userRole:{
        [Op.in]:typeArray
      }
    }
  });

  return users;
}

function getSum(total, num) {
  if(isNaN(num)) return total;
  return total + num;
}
