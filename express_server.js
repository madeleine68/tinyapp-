//All package imports
const express = require("express");
const bodyParser = require("body-parser");

// default port 8080
const PORT = 8080; 

//Server setup
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


function generateRandomString() {
  const randomStr = Math.random().toString(36).substring(2,8);
  return randomStr;
}

//DataBase
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//GET functions
app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[id][shortURL] };
    res.render("urls_show", templateVars);

});

app.get("/urls", (req, res) => {
    const templateVars = { urls :urlDatabase };
    res.render("urls_index", templateVars);
});

app.get("/urls/:id", function(req, res) {
    res.render("urls_show", templateVars);
});   

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
    longURL = urlDatabase[shortURL];
    res.redirect(longURL);
  });

////POST function
app.post("/urls", (req, res) => {
    let longURL = req.body.longURL;
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = longURL;
    //console.log(req.body);  // Log the POST request body to the console
    res.send("Ok");         // Respond with 'Ok' (we will replace this)
});








app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




