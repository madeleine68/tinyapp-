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


module.exports = {userIdFromEmail ,getUserByEmail, generateRandomString, urlsForUser };