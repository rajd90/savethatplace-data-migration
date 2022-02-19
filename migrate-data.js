const fs = require('fs');
const axios = require('axios');
const gql = require('graphql-tag');
const graphql = require('graphql');
const { print } = graphql;

// --- start user config ---
const APPSYNC_API_URL = "https://ou4kcx6jpjgztlyqexljok6w5m.appsync-api.us-east-1.amazonaws.com/graphql";
const APPSYNC_API_KEY = 'da2-67faiqfznve2tb6jxmos7pud3q';
// --- end user config ---


const createProfile = gql`
  mutation createProfile($input: CreateProfileInput!) {
    createProfile(input: $input) {
      id
    }
  }
`

var data = JSON.parse(fs.readFileSync('./aws-export/ddb-extract.json', 'utf8')); // data from old dynamodb table
data.forEach(function(record) {
    try {
        const graphqlData = await axios({
          url: APPSYNC_API_URL,
          method: 'post',
          headers: {'x-api-key': APPSYNC_API_KEY},
          data: {
            query: print(createProfile),
            variables: {
              input: {
                  name: "",
                  handle: "",
                  email: "",
                  owner: "",
                }
            }
          }
        });
        console.log("Success: Everything executed correctly");
      } catch (err) {
        console.log('Error: ', err);
      }
});
