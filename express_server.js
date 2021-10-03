//All package imports
const express = require("express");
const ejs = require('ejs')
const bodyParser = require("body-parser");
//const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { userIdFromEmail, getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');


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

//GET functions
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    user: users[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(401).send("You must be logged in to a valid account to create short URLs.");
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {user: users[req.session.user_id]};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  let templateVars = { urlDatabase, userUrls, shortURL, user: users[userID] };

  if (!urlDatabase[shortURL]) {
    const errorMessage1 = 'This short URL does not exist.';
    res.status(404).render(errorMessage1);
  } else if (!userID || !userUrls[shortURL]) {
    const errorMessage2 = 'You are not authorized to see this URL.';
    res.status(401).render(errorMessage2);
  } else {
    res.render('urls_show', templateVars);
  }
});

app.post('/urls/:shortURL', (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.status(401).send("You do not have authorization to edit this short URL.");
  }
});

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

app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    const errorMessage = 'This short URL does not exist.';
    res.status(404).render(errorMessage);
  }
});

app.get('/login', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {user: users[req.session.userID]};
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

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  const id = req.session.user_id;
  const user = id ? users[id] : null;
  let templateVars = { user };
  res.render("urls_registeration", templateVars);
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

app.get("/urls/:id", function(req, res) {
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});