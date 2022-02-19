const { Parser, transforms: { unwind, flatten } } = require('json2csv');
const fs = require('fs');

var data = JSON.parse(fs.readFileSync('./aws-export/us-east-1_4YqBU8N4z.json', 'utf8')); // data from old cognito user pool
var data = data.map((u) => {
  // u.Attributes = u.Attributes.map(({ Name, Value}) => ({ [Name]: Value }))
  u.Attributes.forEach(({ Name, Value}) => {u[Name] = Value;});
  delete u.Attributes;
  // console.log(u["Attributes"].map(({ Name, Value}) => ({ [Name]: Value })));
  return u;
});
// fs.writeFileSync('./aws-export/cognito-backup.json', JSON.stringify(data), {encoding: "utf8"})
try {
  const parser = new Parser({ transforms: [ flatten({arrays: true})] });
  const csv = parser.parse(data);
  fs.writeFileSync('./aws-export/cognito-backup.csv', csv, {encoding: "utf8"})
  // console.log(csv);
} catch (err) {
  console.error(err);
}