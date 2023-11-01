const fs = require('fs');
const axios = require('axios');
const gql = require('graphql-tag');
const graphql = require('graphql');
const csv = require('csvtojson');
const { print } = graphql;

// --- start user config ---
const APPSYNC_API_URL = "https://ou4kcx6jpjgztlyqexljok6w5m.appsync-api.us-east-1.amazonaws.com/graphql";
const APPSYNC_API_KEY = 'da2-cjs6dphpcrbp7kowqkft4uub6a';
// --- end user config ---

const createUserGQL = gql`
  mutation createUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      cognitoUsername
      cognitoEmail
    }
  }`

var missing_users = JSON.parse(fs.readFileSync(`./add-missing-users/missing-users.json`, 'utf8')); // list of missing users

missing_users.forEach(async (user) => {
  await createUser(user);
});


async function createUser(user) {
  console.log("createUser: " + user.username + ", " + user.email);
  try {
    const graphqlData = await axios({
      url: APPSYNC_API_URL,
      method: 'post',
      headers: {
        'x-api-key': APPSYNC_API_KEY
      },
      data: {
        query: print(createUserGQL),
        variables: {
          input: {
            cognitoUsername: user.username,
            cognitoEmail: user.email,
            owner: user.username
          }
        }
      }
    });
    console.log("Success: Everything executed correctly");
  } catch (err) {
    console.log('error creating user: ', err);
  }
}