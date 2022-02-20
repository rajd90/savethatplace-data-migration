const { Parser, transforms: { unwind, flatten } } = require('json2csv');
const fs = require('fs');

const userPoolId = "us-east-1_4YqBU8N4z"; // old user pool id
// const userPoolId = "us-east-1_M7xUfNCRR"; // new user pool id

var data = JSON.parse(fs.readFileSync(`./aws-export/${userPoolId}.json`, 'utf8')); // data from old cognito user pool

var data = data.map((u) => {
  u.Attributes.forEach(({ Name, Value}) => {u[Name] = Value;});
  delete u.Attributes;
  return u;
});

fs.writeFileSync(`./aws-export/${userPoolId}-converted.json`, JSON.stringify(data), {encoding: "utf8"})
try {
  const parser = new Parser({ transforms: [ flatten({arrays: true})] });
  const csv = parser.parse(data);
  fs.writeFileSync('./aws-export/cognito-backup.csv', csv, {encoding: "utf8"})
} catch (err) {
  console.error(err);
}