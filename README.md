# savethatplace-data-migration

Code to migration the old SaveThatPlace data from a DynamoDB extract to the new schema via the new AppSync API

## Extracting Places, Tags, etc. from old DynamoDB table

There are 2 ways to achieve this:

1. On the DynamoDB table set up an export via the portal. This outputs a json-lines formatted file to an S3 bucket. In this case, it's easy to use a simple find and replace to convert to regular json array.
2. Run a scan (and be sure to request all additional pages of data), and then export results. This gets a CSV.

Option 1 is probably safer / easier. And it makes it simpler to work with for other scripts.

## Extracting users from old Cognito User Pool

Create an AWS config file in the format...

```
{
  "accessKeyId": "<key id goes here>",
  "secretAccessKey": "<key secret goes here>",
  "region": "us-east-1"
}
```

Then, run the following command in git bash / command line from the root of the repo. You may need to open the .js file and choose the correct user pool id.

```
$ node aws-export/0-cognito-backup.js
$ node aws-export/1-convert-cognito-users.js
```

This will produce a CSV file of the Cognito users that you can manipulate more easily in Excel and match the required format. It will also produce a .json file of the converted objects (which may be easier to work with for the other scripts).

## Migrate users to new user pool

This takes a bit of manual work...

1. From the AWS console, go to the new pool and download the required CSV headers.
2. Copy the relevant data from the CSV created in the previous step. The new pool requires the cognito:username to be the **email address**
3. Delete and users created via federated identities (i.e. sign in with google or facebook or apple).
4. Create a user import job via the AWS console in the new user pool and start the job.

This will not create the user nor profile in the dynamodb table. So we'll need to create the profile in dynamodb manually. (The user in dynamodb will be created automatically once the user resets their password or signs in the for the first time in the new pool).

## Create the new profiles in dynamodb

The owner of the profile (in ddb) must be the Username / User name. This is different from cognito:username and it is different from the User ID (aka 'sub').

That means we must run the 0-cognito-backup.js again, for the new user pool, to get the correct new username. We will need to combine that with the users from the old user pool who were created using social federation.

You may also need to remove some duplicate users (e.g. when someone has signed in with both their email and then later with google or facebook, or if they sign in with facebook first and then google later.)

Open migrate-data.js and comment out the place creation lines, and uncomment the profile creation lines. Then, run...

```
$ node migrate-data.js
```

## Create the new places in dynamodb

1. Download the new profiles in ddb from the previous step into the root directory as ddb-new-profiles.csv
2. Open migrate-data.js and comment out the profile creation lines, and uncomment the place creation lines
3. Run...

```
$ node migrate-data.js > migrate.log
```
