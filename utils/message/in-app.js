
exports.sendInAppMessage =  async function(ioSocket,username,message){
  try {
    if(!ioSocket) ioSocket = global.socketServerInstance;
    ioSocket.to("user@example.com").emit("message", message);
  } catch (error) {
    console.log(error);
  }

  console.log("sent in app message");
}

exports.sendInAppMessageWithFile =  function(ioSocket,username,message,file){
  try {
    if(!ioSocket) ioSocket = global.socketServerInstance;
    let data = {
      message,
      fileUrl
    }
    ioSocket.to("user@example.com").emit("message", data);
  } catch (error) {
    console.log(error);
  }

  console.log("sent in app message");
}

exports.sendInAppAction =  function(ioSocket,username,action,message){
  try {
    if(!ioSocket) ioSocket = global.socketServerInstance;
    ioSocket.to("user@example.com").emit(action, message);
  } catch (error) {
    console.log(error);
  }

  console.log("sent in app message");
}


exports.sendInAppRequestService =  function(ioSocket,username,data){
  try {
    console.log(username);
    if(!ioSocket) ioSocket = global.socketServerInstance;
    ioSocket.to("user@example.com").emit("job-request",data);
  } catch (error) {
    console.log(error);
  }

  console.log("sent in app message");
}
