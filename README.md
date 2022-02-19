# savethatplace-data-migration

Code to migration the old SaveThatPlace data from a DynamoDB extract to the new schema via the new AppSync API

## Extracting Places, Tags, etc. from old DynamoDB table

There are 2 ways to achieve this:

1. On the DynamoDB table set up an export via the portal. This outputs a json-lines formatted file to an S3 bucket. In this case, it's easy to use a simple find and replace to convert to regular json array.
2. Run a scan (and be sure to request all additional pages of data), and then export results. This gets a CSV.

## Extracting users from old Cognito User Pool

Create an AWS config file in the format...

```
{
  "accessKeyId": "<key id goes here>",
  "secretAccessKey": "<key secret goes here>",
  "region": "us-east-1"
}
```

Then, run the following command in git bash / command line from the root of the repo....

```
$ node aws-export/0-cognito-backup.js
$ node aws-export/1-convert-cognito-users.js
```

This will produce a CSV file of the Cognito users that you can manipulate more easily in Excel and match the required format.
