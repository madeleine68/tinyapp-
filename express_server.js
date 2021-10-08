//All package imports
const express = require("express");
const ejs = require('ejs')
const bodyParser = require("body-parser");
//const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { userIdFromEmail, getUserByEmail, generateRandomString, urlsForUser, urlParser, urlOwnership, shortURLCheck } = require('./helpers');


// default port 8080
const PORT = 8080; 

//Server setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// activate cookieParser
//app.use(cookieParser());
app.use(cookieSession({ name: 'session', keys: ['key1', 'key2']}))

//DataBase
const urlDatabase = {};
const users = {};

// Root directory for unkown user to /login or /urls for logged-in user
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    //if there is no user_id
    res.redirect('/login');
  }
});

// My URLs
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if(!userID) {
    res.status(401);
  }
  //List of user created URLs  generated based on user id
  const templateVars = {
    urls: urlsForUser(userID, urlDatabase),
    user: users[userID]
  };
  res.render("urls_index", templateVars);
});


// Adding a new URL entry to db after user enters a new URL then redirect to /urls/${shortURL}
app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    // A randomly generated string
    const shortURL = generateRandomString();
    //urlParser append an http// prefix to the URL if neccessaryreq.body.longURL
    const longURL = urlParser(req.body.longURL);
    urlDatabase[shortURL] = {
      longURL:longURL,
      userID: req.session.user_id
    };
    return res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(401).send("You must be logged in to a valid account to create short URLs.");
  }
  
});

//Creating a new short URL
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    const templateVars = {user: users[userID]};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const userID = req.session.user_id;
  const shortURLparam = req.params.shortURL;
  if (!userID) {
    return res.redirect('/register');
  }
  // If the requested short URL is NOT in the database
  if (!urlDatabase[shortURLparam]) {
    return res.send('Requested short URL is not in the database');
  }
  // If the requested short URL does NOT belong to the current user
  
  if (!urlOwnership(userID, shortURLparam, urlDatabase)) {
    return res.send('You dont own this URL');
  }
  // Traffic stats and other info
  const querylongURL = urlDatabase[shortURLparam].longURL;
  const templateVars = {
    user: userID,
    shortURL: shortURLparam,
    longURL:querylongURL,
  };
  res.render('urls_show', templateVars);
});

// update URL db after user edits existing one
app.post('/urls/:shortURL', (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    urlDatabase[shortURL].longURL = req.body.updatedURL;
    res.redirect('/urls');
  } else {
    res.status(401).send("You do not have authorization to edit this short URL.");
  }
});

///Delete sn URL from db as per user request
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(401).send("You do not have authorization to delete this short URL.");
  }
});

// redirect to the linked external url
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if(urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL
    if(!longURL) return res.status(404).send("This short URL does not exist");
    res.redirect(longURL);
  } else {
    res.status(404).send('The short URL you are trying to access does not correspond with a long URL')
  }
});

// Sign in
app.get('/login', (req, res) => {
  const userID = req.session.user_id; 
  if (userID) {
    res.redirect('/urls');
    return;
  }
  const templateVars = {user: userID};
  res.render('urls_login', templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!getUserByEmail(email, users)) {
    res.status(403).send("There is no account associated with this email address");
  } else {
    const userID = userIdFromEmail(email, users);
    if (!bcrypt.compareSync(password, users[userID].password)) {
      res.status(403).send("The password you entered does not match the one associated with the provided email address");
    } else {
      req.session.user_id = userID;
      res.redirect("/urls");
    }
  }
});

//log out
app.post('/logout', (req, res) => {
  userID = req.session.user_id;
  if (userID) {
    req.session = null;
  }
  res.redirect('/login');
});

// account registration
app.get('/register', (req, res) => {
  const userID = req.session.user_id;
  const user = userID ? users[userID] : null;
  let templateVars = { user };
  res.render("urls_registration", templateVars);
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  //if email or password input is blank throw an error
  if (email === "" || password === "") {
    res.status(400).send("An email or password needs to be entered.")
    return
    //if email is already in use throw an error 
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("Email is already in use.")
    return
  } else {
    //if the email is not in use, create a new user for TinyApp
    const userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: email,
      password: bcrypt.hashSync(password, 10)
    }
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

// app.post("/urls/:id", function(req, res) {
//   const shortURL = req.params.userID;
//   if (urlDatabase[shortURL] && req.session.userID === urlDatabase[shortURL].userID) {
//     urlDatabase[shortURL].longURL = req.body.longURL;
//     return res.redirect("/urls");
//   }
//   res.status(403).send ("you need to log in to edit URLs");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});