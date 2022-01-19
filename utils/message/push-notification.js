require("dotenv").config();
var admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

let sampleMessage = {
  notification:{
    title:"Book service", 
    body:"I need a carpenter"
  }
};

const registrationToken = 'YOUR_REGISTRATION_TOKEN';

async function sendNotification(token=[registrationToken],message=sampleMessage){
  if(token.length < 1) {
    console.log(`Error sending the notification  ::: No reg token passed`);
    return;
  }
  try{
    let messagePayload = {
      notification : message,
    }
    const {failureCount, successCount} = await admin.messaging().sendToDevice(token,messagePayload,{priority:'high'});
    console.log(`Successfully sent the notification to ${successCount} devices  (${failureCount} failed).`);
  }catch(err){
    console.log(`Error sending the notification  ::: ${err}`);
  }
}

module.exports.sendNotification = sendNotification;





// Send a message to the device corresponding to the provided
// registration token.

