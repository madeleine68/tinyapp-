const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};


function generateRandomString() {
  const randomStr = Math.random().toString(36).substring(2,8);
  return randomStr;
}


const urlsForUser = (id, database) => {
  let userUrls = {};

  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      userUrls[shortURL] = database[shortURL];
    }
  }

  return userUrls;
};

const userIdFromEmail = function(email, userDatabase) {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user].id;
    }
  }
};

// URL Parser
// Checks if provided URL contains an "http://" prefix and adds one if not
const urlParser = function(newLongURL) {
  // Negative check - RegExp that checks if the URL does NOT have a scheme/protocol specified
  const schemeNegCheck = /^([A-Za-z]+.)+[A-Z-a-z]+(\/?$|\/.+$)/;
  // If a protocl prefix is absent, "http://" will be added
  return schemeNegCheck.test(newLongURL) ? `http://${newLongURL}` : newLongURL;
};

const urlOwnership = function(userID, shortURL, database) {
  return database[shortURL].userID === userID
};

const shortURLCheck = function(queryShortURL, sourceDatabase) {
  // console.log('sourceDatabase', sourceDatabase)
  for (const shortURL in sourceDatabase) {
    // console.log('shortURL:', shortURL)
    // console.log('queryShortURL:', queryShortURL)
    if (shortURL !== queryShortURL) {
      return false;
    }
  }
  return true;
};


module.exports = {userIdFromEmail ,getUserByEmail, generateRandomString, urlsForUser, urlParser, urlOwnership, shortURLCheck };