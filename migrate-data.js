const fs = require('fs');
const axios = require('axios');
const gql = require('graphql-tag');
const graphql = require('graphql');
const csv = require('csvtojson');
const { print } = graphql;

// --- start user config ---
const APPSYNC_API_URL = "https://ou4kcx6jpjgztlyqexljok6w5m.appsync-api.us-east-1.amazonaws.com/graphql";
const APPSYNC_API_KEY = 'da2-67faiqfznve2tb6jxmos7pud3q';

const old_userPoolId = "us-east-1_4YqBU8N4z"; // old user pool id
const new_userPoolId = "us-east-1_M7xUfNCRR"; // new user pool id
// --- end user config ---

const createProfileGQL = gql`
  mutation createProfile($input: CreateProfileInput!) {
    createProfile(input: $input) {
      id
    }
  }
`;

var old_users = JSON.parse(fs.readFileSync(`./aws-export/${old_userPoolId}-converted.json`, 'utf8')); // data from old cognito user pool
var new_users = JSON.parse(fs.readFileSync(`./aws-export/${new_userPoolId}-converted.json`, 'utf8')); // data from new cognito user pool
// old_users.forEach(async (user) => {
//   if(user.Username.startsWith("Google_") || user.Username.startsWith("Facebook_") || user.Username.startsWith("SignInWithApple_")) {
//     await createProfile(user);
//   }
// });
// new_users.forEach(async (user) => {
//   await createProfile(user);
// })


// async function createProfile(user) {
//   console.log("createProfile: " + user.Username);
//   try {
//     const graphqlData = await axios({
//       url: APPSYNC_API_URL,
//       method: 'post',
//       headers: { 'x-api-key': APPSYNC_API_KEY },
//       data: {
//         query: print(createProfileGQL),
//         variables: {
//           input: {
//             name: user.name,
//             handle: user.email.split("@")[0],
//             email: user.email,
//             owner: user.Username.toLowerCase(),
//           }
//         }
//       }
//     });
//     console.log("data...");
//     console.log(graphqlData.data.data);
//     console.log("errors...");
//     console.log(graphqlData.data.errors);
//   } catch (error) {
//     console.log('Error: ', error);
//   }
// }


const createPlaceGQL = gql`
  mutation MyMutation($input: CreatePlaceInput!) {
    createPlace(input: $input) {
      id
    }
  }
`;

var data = JSON.parse(fs.readFileSync('./aws-export/ddb-extract.json', 'utf8')); // data from old dynamodb table
// var data = JSON.parse(fs.readFileSync('./sample.json', 'utf8')); // data from old dynamodb table
var all_place_ids = [];
csv().fromFile('ddb-new-profiles.csv').then((new_profiles) => {
  new_profiles.forEach(async (profile, index) => {
    // console.log(`${index},${profile.id},${profile.owner},${profile.email}`);
    if(profile.owner.startsWith("google_")) {
      // console.log("social user: google");
      profile.old_owner = profile.owner.replace("google_", "Google_");
    } else if (profile.owner.startsWith("facebook_")){
      // console.log("social user: facebook");
      profile.old_owner = profile.owner.replace("facebook_", "Facebook_");
    } else if (profile.owner.startsWith("signinwithapple_")){
      // console.log("social user: apple");
      profile.old_owner = profile.owner.replace("signinwithapple_", "SignInWithApple_");
    } else {
      // console.log("non-social user");
      let old_owner = old_users.filter((u) => u.email == profile.email && !u.Username.startsWith("Google_") && !u.Username.startsWith("Facebook_") &&!u.Username.startsWith("SignInWithApple_"))[0];
      if (old_owner) {
        profile.old_owner = old_owner.Username
      } else {
        console.log("ERROR: old username couldn't be found for " + profile.email)
      }
    }
    if("old_owner" in profile) {
      let my_data = data.filter((p) => p.Item.part_key.S.startsWith(`PLACE#${profile.old_owner}`));
      let my_unique_place_ids = [...new Set(my_data.map((p) => p.Item.part_key.S))];
      all_place_ids.push(...my_unique_place_ids);
      console.log(`For ${profile.owner}, ${profile.id}, expect ${my_unique_place_ids.length} places`);
      my_unique_place_ids.forEach(async (placeID) => {
        let merged_copy = Object.assign({}, ...my_data.filter((p) => p.Item.part_key.S == placeID).map((p) => p.Item));
        // console.log(JSON.stringify(merged_copy));
        await createPlace(profile.owner,profile.id, merged_copy);
      });
    }
  });
  console.log("Total places expected: " + all_place_ids.length);
});


async function createPlace(owner, profileID, place) {
  let _types = []
  try {
    if ("types" in place) {
      _types = place.types.L.map((t) => "S" in t ? t.S.trim() : ("M" in t ? t.M.S.S.trim() : null)).filter((t) => t);
    }
  } catch (error) {
    console.log("Error mapping place types...");
    console.log(error);
  }
  try {
    const graphqlData = await axios({
      url: APPSYNC_API_URL,
      method: 'post',
      headers: { 'x-api-key': APPSYNC_API_KEY },
      data: {
        query: print(createPlaceGQL),
        variables: {
          input: {
            profileID: profileID,
            owner: owner,
            place_id: place.place_id.S,
            name: place.name.S,
            formatted_address: place.formatted_address.S,
            lat: parseFloat(place.coords.M.lat.N),
            lng: parseFloat(place.coords.M.lng.N),
            icon: "icon" in place ? place.icon.S : null,
            note: "note" in place ? place.note.S : null,
            rating: "rating" in place ? parseFloat(place.rating.N) : null,
            recommendedByText: "recommended_by" in place ? place.recommended_by.S : null,
            review: "review" in place ? place.review.S : null,
            tags: "filters" in place ? ("tags" in place.filters.M ? place.filters.M.tags.L.map((t) => t.S) : []) : [],
            types: _types,
            saved: "saved" in place ? place.saved.BOOL : false,
            visited: "filters" in place ? ("visited" in place.filters.M ? place.filters.M.visited.BOOL : false) : false,
          }
        }
      }
    });
    let _errors = JSON.stringify(graphqlData.data.errors);
    if(_errors) {
      console.log("createPlace: " + place.place_id.S + " for " + owner + " and " + profileID);
      console.log(JSON.stringify(place));
      console.log("errors...");
      console.log(_errors);
    }
  } catch (error) {
    console.log('Error: ', error);
  }
}
