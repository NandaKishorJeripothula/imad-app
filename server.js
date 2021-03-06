var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool = require('pg').Pool;
var articleData;
var crypto = require('crypto');
var bodyParser = require('body-parser');
//database connectivity to the app uysing npm postgress package named as pg package

const config = {
  user: 'jkishorbd',
  host: 'db.imad.hasura-app.io',
  database: 'jkishorbd',
  password: 'db-jkishorbd-77150',
  port: 5432,
};
var pool= new Pool(config);

//name array
var names=[];
var app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());

//counter page value
var counter=0;
//more pages array
//database replaces this code..
/*
var articlesDatabase={
  'article-one':{
    title :'Article-One | Nandu',
    heading :'Articel-One | Nandu',
    date  :'August 13 2017',
    content : `Stupid this is from the Article -One
              try other one`,
    num :'1'
  },
  'article-two':{
    title :'Article-Two | Nandu',
    heading :'Articel-Two | Nandu',
    date  :'August 14 2017',
    content : `Stupid this is from the Article -Two
              try other one`,
    num :'2'
  },
  'article-three':{
    title :'Article-Three | Nandu',
    heading :'Articel-Three | Nandu',
    date  :'August 15 2017',
    content : `Stupid this is from the Article -Three
              try other one`,
    num :'3'
  }
};
*/

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});function hash(input,salt){
    //input to be hashed
    //salt - added string extra
    //10000 function iterations
    //512 keylenght
    //sha512 alg
    var key = crypto.pbkdf2Sync(input, salt, 100000, 512, 'sha512');
    console.log(key.toString('hex'));  // '3745e48...aa39b34'
    //return [input,salt,"sha152","512length",key].join("$");
    return key;
}
app.get('/hash/:input', function(req,res){
    var hashString= hash(req.params.input,'specify-the-salt-here');
    res.send(hashString);
});
app.post('/create-user',function(req,res){
    //curl for pushing a new user is
    //curl -v  -XPOST -H 'Content-Type: application/json' --data '{"username": "bhargavi" , "password" : " imad.hasura-app.io/create-user
    //security doesnt allow reading from url in post...so
    //using curl and json data we are creating user..
    //by using bod parser
    var username= req.body.username;
    var password= req.body.password;
    const salt = crypto.randomBytes(128).toString('hex');
    hashResult= hash(password,salt);
    pool.query('INSERT INTO "user" ("username", "password") VALUES ($1,$2);',[username,hashResult],function(err, result){
   
        if(err){
            //query err
            res.status(500).send(err.toString());
        }  else{
            res.send('successfully created user ' + username);    
            
        }
    });
    
});
app.get('/testDatabase',function(req,res){
  pool.query(`
  SELECT *
FROM "testDatabase"
LIMIT 50`,function(err,result){
    if(err){
      res.status(500).send(err.toString);
    }
    else{
      res.send(JSON.stringify(result.rows));
    }
  });
});

/**
 * var articelone= {
    title :'Article-One | Nandu',
    heading :'Articel-One | Nandu',
    date  :'August 13 2017',
    content : `Stupid this is from the Article -One
              try other one`
};

 *app.get('/article-one', function (req, res) {
   res.send(createTemplate(articelone));
  });
 
 */


//page calling funtion
app.get('/submit-btn',function(req,res){ // here the url format is /submit-btn?name=xxx so the query attribute will get to names whos value is xxx
  var name=req.query.name;
  names.push(name);
  //sending 
  res.send(JSON.stringify(names));

});
var cmnData={};
app.get('/comment',function(req,res){
  var cmnName=req.query.cmnName;
  var cmnText=req.query.cmnText;
  JSON.cmnData[cmnName]=cmnText;
  res.send(JSON.stringify(cmnData));
});
app.get('/:articleNameFromUrl',function(req,res){
  //here we are using the : for retriving the succeeding text into variable from express framework
  var articleNameRetrieved= req.params.articleNameFromUrl;
  if(articleNameRetrieved=="home"){
    res.sendFile(path.join(__dirname, 'ui', 'home.html'));
  }
  else if(articleNameRetrieved=="counter"){
    counter = counter + 1;
    res.send(counter.toString());

  }
  else{
   /* unsecure flow of variables.... hackers may attack by xss scripting
   pool.query("SELECT * FROM article WHERE title = '"+articleNameRetrieved+"'",function(err, result){
   */
   pool.query("SELECT * FROM article WHERE title = $1",[articleNameRetrieved],function(err, result){
   
        if(err){
            //query err
            res.status(500).send(err.toString());
        }  else{
            //record not found
            if(result.rows===0){
                res.status(40).send("article not found in the record database");
        
            }else{
            //record fount and fetching
            // we need only the one record
            //hence
            articleData= result.rows[0];
            res.send(createTemplate(articleData));    
            }
            
        }
    });
    
   // res.send(createTemplate(articlesDatabase[articleNameRetrieved]));
  }
});


//duynamic page creator
var createTemplate = function(articleData){
  var title= articleData.title;
  var date= articleData.date;
  var content= articleData.content;
  var num=articleData.num;
  var htmlBody= `
  <html>              
    <head>
        <title>${title} </title>
        <link rel="stylesheet" href="/ui/style.css">
        <script src="/ui/main.js"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body class="container">
      <center>
        <h2>
            THIS IS FROM THE DATABASE STUPID
        </h2>
        <h5>${date.toDateString()}</h5>
        <p>${content}</p>
        <h1>${num}</h1>
        <span>
          <button><a href="/">Home</a></button>
          <button><a href="/article-one">1</a></button>
          <button><a href="/article-two">2</a></button>
          <button><a href="/article-three">3</a></button>
          
        </span>
        <div>
          <input type="text" placeholder="Name" id="commentorName">
          <input type="text" placeholder="Name" id="commentorText">
          <input type="submit" value="Send" id="submit-cmn">
          <ul id="cmnList">
            </div>
    
      </center>
    </body>
</html>`;
  return htmlBody;
};
app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});


app.get('/ui/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'main.js'));
});

app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});

app.get('/ui/css/materialize.min.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'materialize.min.css'));
});
app.get('/ui/css/custom.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'custom.css'));
});
app.get('/ui/css/font-awesome.min.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'font-awesome.min.css'));
});
app.get('/ui/js/jquery-3.2.0.min.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/js', 'jquery-3.2.0.min.js'));
});
app.get('/ui/js/materialize.min.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/js', 'materialize.min.js'));
});
app.get('/ui/js/custom.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/js', 'custom.js'));
});
app.get('/ui/media/bg.jpg', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/media/', 'bg.jpg'));
});
app.get('/ui/media/nanduProfileImage.jpeg', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/media/', 'nanduProfileImage.jpeg'));
});
app.get('/ui/media/ofc.jpg', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/media/', 'ofc.jpg'));
});
//resolving issues
// Do not change port, otherwise your app won't run on IMAD servers
// Use 8080 only for local development if you already have apache running on 80

var port = 80;
app.listen(port, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
