var duration = {"s":1000,"m":60000,"h":3600000,"d":86400000}
exports.isFuture = function(dateTime){
  let taskDate = new Date(dateTime);
  let currentDate = new Date();
  return taskDate > currentDate;
}

//true if dateTime1 is greater than dateTime2
exports.isAhead = function(dateTime1,dateTime2){
  let date1 = new Date(dateTime1);
  let date2 = new Date(dateTime2);
  return date1 > date2;
}


exports.difference = function(dateTime1,dateTime2,unit){
  let date1 = new Date(dateTime1);
  let date2 = new Date(dateTime2);
  let offset = new Date().getTimezoneOffset();
  let difference = date1 - date2;// + (offset * 60000);
  console.log(difference);
  let denominator = duration[unit]? duration[unit] : 1000;
  console.log(denominator);
  return Math.abs(Math.floor(difference/denominator));
}

exports.sameDay = function(dateTime1, dateTime2) {
  let d1 = new Date(dateTime1);
  let d2 = new Date(dateTime2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

exports.isToday = function(dateTime1){
  let d1 = new Date(dateTime1);
  let d2 = new Date();

  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

}