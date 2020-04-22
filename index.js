#!usr/bin/env node

var express = require('express'),
enable_cors = require('cors'),
app = express(),
port = process.env.PORT || 8080,
mongoose = require('mongoose'),
User = require('./api/models/userModel'),
RestApi = require('./api/models/restApiModel'),
Provider = require('./api/models/providerModel')
ContributionHistory = require('./api/models/contributionHistoryModel'),
// admin = require('firebase-admin'),
// serviceAccount = require("./acme-explorer-6415d-firebase-adminsdk-ea57g-024809d2fe"),
bodyParser = require('body-parser');
require('dotenv').config();
var fs = require('fs');
var http = require('http');
var admin = require('firebase-admin'),
serviceAccount = require('./firebase-config.json');
// MongoDB URI building
var mongoDBUser = process.env.MONGO_USER || "admin";
var mongoDBPass = process.env.MONGO_PASSWORD || "mdp";
var mongoDBCredentials = (mongoDBUser && mongoDBPass) ? mongoDBUser + ":" + mongoDBPass + "@" : "";

var mongoDBHostname = process.env.mongoDBHostname || "localhost";
var mongoDBPort = process.env.mongoDBPort || "27017";
var mongoDBName = process.env.mongoDBName || "API_Repository";

var mongoDBURI = process.env.MONGO_URL ||"mongodb://" + mongoDBCredentials + mongoDBHostname + ":" + mongoDBPort + "/" + mongoDBName;
 
mongoose.connect(mongoDBURI, {
    reconnectTries: 10,
    reconnectInterval: 500,
    poolSize: 10, // Up to 10 sockets
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // skip trying IPv6
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit: '10mb'}));
app.use(enable_cors());

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tfm-api-repositorio.firebaseio.com"
});

var contributionHistoryRoutes = require('./api/routes/contributionHistoryRoutes'),
providerRoutes = require('./api/routes/providerRoutes'),
restApiRoutes = require('./api/routes/restApiRoutes'),
userRoutes = require('./api/routes/userRoutes'),
oasDocRoutes = require('./api/routes/oasDocRoutes');
 
contributionHistoryRoutes(app);
providerRoutes(app);
restApiRoutes(app);
userRoutes(app);
oasDocRoutes(app);
 
console.log("Connecting DB to: " + mongoDBURI);
mongoose.connection.on("open", function (err, conn) {
    Users.findOne({"email": "admin@test.com"}, (err, user) => {
        if(!user) {
            new User({
                "username": "Admin",
                "email": "admin@test.com",
                "password": mongoDBPass,
                "role": "Administrator",
                "banned": false
            }).save();
        }
    });
    
    http.createServer(app)
    .listen(port, function () {
        console.log('API Respository RESTful API server started on: ' + port);
    });
});
 
mongoose.connection.on("error", function (err, conn) {
    console.error("DB init error " + err);
});

module.exports = app;