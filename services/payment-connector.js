const axios = require("axios");
require("dotenv").config();
const env = process.env.NODE_ENV || "development";
const { AppSuccess, AppError } = require("../utils");
const logger = require("../utils/logger");
const qs = require('qs');

const baseUrl = `https://api.paystack.co`;
const token = `Bearer ${process.env.PAYSTACK_SECRETKEY}`;

module.exports.listBanks = async function () {
  let url = `${baseUrl}/bank`;
  let params = { countryCode: "nigeria", user_cursor: false };
  let headers = { Authorization: token };
  let response = await axios.get(url, { params }, { headers });
  let responseData;

  if (response.status === 200 && response.data.status === true) {
    responseData = response.data.data.map((bankInfo) => {
      let { name, code } = bankInfo;
      return { name, code };
    });
    return responseData;
  } else throw Error(`Request processing error ${response.status}`);
};

module.exports.getUserName = async function (bankCode, accountNumber) {
  bankCode = bankCode.trim();
  accountNumber = accountNumber.trim();

  if (!bankCode || !accountNumber) {
    throw new AppError().GENERIC_ERROR(
      "bank code and account number must not be empty"
    );
  }

  let url = `${baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
  let response = await axios.get(url, {
    headers: { Authorization: token },
  });

  logger.info(response.data);
  if (response.status === 200 && response.data.status === true) {
    return response.data.data;
  } else if (response.data.message === "Invalid key") {
    throw new AppError().INVALID_KEY();
  } else throw new AppError().GENERIC_ERROR(response.data.message);
};

module.exports.reversePayment = async function(data) {
  console.log("Refunded customer money");
}

//to debit customer
module.exports.debit = async function(customer,price){
  if (!customer?.email || !price) {
    throw new AppError().GENERIC_ERROR(
      "Invalid parameters"
    );
  }
  let url = `${baseUrl}/transaction/initialize`;
  let data = { 
    email: customer.email, 
    amount: price * 100
  }

  let response = await axios.post(url, 
    data,
    { headers: { Authorization: token }},
  );

  if(response?.data?.status === true){
    console.log("Debit done");
    return response.data;
  }
  else{
    console.log(response);
    throw new AppError().GENERIC_ERROR(
      response?.data?.message
    );
  }

}

//change to verify customer debit
module.exports.verifyPayment = async function(reference){
  if(!reference) throw new AppError().GENERIC_ERROR("Please pass a valid reference");
  try{
    let url = `${baseUrl}/transaction/verify/${reference}`;
    let headers = { Authorization: token };
    let params = { countryCode: "nigeria", user_cursor: false };
    console.log(url);
    let response = await axios.get(url, { headers });

    if(response?.data?.status && response?.data?.data?.status === "success"){
      return true;
    }
    return false;
  }
  catch(error){
    logger.info(error);
    throw new AppError().GENERIC_ERROR(error.message);
  }

}


module.exports.createTransferReceipt = async function(accountDetails){
  let url = `${baseUrl}/transferrecipient`;
  let data = qs.stringify({ 'type': 'nuban', 
    'name': accountDetails.accountName,
    'account_number': accountDetails.accountNumber,
    'bank_code': accountDetails.bankCode, 
    'currency': 'NGN'
  });

  try{
    var config = {
      method: 'post',
      url:url,
      headers:  { 
        Authorization: token,
       },
      data : data
    };
    let response = await axios(config);
    return response?.data?.data;
  }catch(error){

    logger.info(error);
    throw new AppError().GENERIC_ERROR(error.message);
  }

}

module.exports.transfer = async function(referenceCode,amount,taskDescription){
  let url = `${baseUrl}/transfer`;
  let data = { 
    source: "Platform", 
    amount, 
    recipient: referenceCode, 
    reason: taskDescription 
  }

  try {
    let response = await axios.post(url, 
      data,
      { headers: { Authorization: token }},
    );
  
    console.log(`response from transfer ${response}`);
    if(response?.data?.status && response?.data?.data?.status === "success"){
      return { 
        status: true, 
        data: response?.data?.data
      }
    }
    else{
      //log response
      return { 
        status: false, 
        data: response?.data?.data
      }
    }
    
  } catch (error) {
    logger.info(error);
    throw new AppError().GENERIC_ERROR(error.message);
  }

}

module.exports.verifyTransfer = async function(transferCode){
  let url = `${baseUrl}/transfer/verify/${transferCode}`;
  let params = { countryCode: "nigeria", user_cursor: false };
  let headers = { Authorization: token };
  let response = await axios.get(url,
    { headers: { Authorization: token }},
     );

  if(response?.data?.status){
    return response?.data?.message
  }
}


