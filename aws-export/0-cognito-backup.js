var AWS = require('aws-sdk');
var cbr = require('cognito-backup-restore');

AWS.config.loadFromPath('./aws-export/aws-sdk-config.json');
const cognitoISP = new AWS.CognitoIdentityServiceProvider();
const userPoolId = "us-east-1_4YqBU8N4z"; // old user pool id
// const userPoolId = "us-east-1_M7xUfNCRR"; // new user pool id
// you may use async-await too
cbr.backupUsers(cognitoISP, userPoolId, "./aws-export")
  .then(() => console.log(`Backup completed`))
  .catch(console.error)