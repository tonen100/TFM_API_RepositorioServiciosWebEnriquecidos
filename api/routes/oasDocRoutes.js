var express = require('express');
var router = express.Router()
require('dotenv').config();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fireConf = require("../../firebase-config.json");

// Swagger set up
const options = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "RestAPImantics API",
        version: "1.0.0",
        description:
          "RestAPImantics API manages REST APIs that are currently displayed in the web app restapimantics.ml, on top of all related informations (provider...). You can freely use it without any requirements in reading, for most part of it. For modification purposes, just create an account (we will never sell your email address to any mailing list) and start adding RESTfull APIs to the repository through this website or update existing ones (add a new API then add a new version, then link a provider...), but keep in mind that the API uses a firebase autentication system based on custom tokens, so modifications through the web app are much more simple than through the API directly.",
        license: {
          name: "MIT",
          url: "https://choosealicense.com/licenses/mit/"
        },
        contact: {
          name: "Computer languages and systems department, University of Seville",
          email: "piegir2@alum.us.es"
        },
      },
      tags: [
        {
          name :"RestApi"
        }, {
          name :"Provider"
        }, {
          name :"Version"
        }
      ],
      components: {
        parameters: {
          language: {
            name: "Accept-Language",
            in: "header",
            description: "The ISO 639-1 language code that will be used to return error messages. Only the first two letters of the header are relevant.",
            required: false,
            schema: {
              type: "string",
              default: "en-US"
            },
            example: "en-US"
          }
        },
        securitySchemes: {
          firebase: {
            type: "oauth2",
            name: "firebase",
            flows: {
              password: {
                tokenUrl: "http://localhost:8080/v1/login",
                scopes: {
                  "write":"Edit the API state"
                }
              }
            },
            "description": "Custom token retrieved by logging in ('/login')",
          }
        },
      },
      servers: [
        {
          url: process.env.URL_APP || "http://localhost:8080/v1"
        }
      ]
    },
    apis: [//Add your file with swagger doc here
        "./api/models/userModel.js",
        "./api/models/restApiModel.js",
        "./api/models/providerModel.js",
        "./api/models/historyContributionModel.js",
        "./api/controllers/userController.js",
        "./api/controllers/restApiController.js",
        "./api/controllers/versionController.js",
        "./api/controllers/providerController.js",
        "./api/controllers/historyContributionController.js"
    ],
  // security: [{
  //   firebase: []
  // }]
};

const specs = swaggerJsdoc(options);
router.use("/docs", swaggerUi.serve);
router.get(
    "/docs",
    swaggerUi.setup(specs, {
        explorer: true,
        swaggerOptions: {
          oauth: {
            client_id: fireConf.client_id,
            appName: fireConf.project_id,
            additionalQueryParams: {
              apiKey: 'AIzaSyDLqZG0zNK1rZB7S_D_QVRI-KKDPmxNk8g'
            }
          }
        }
    })
);

module.exports = function(app) {
  app.use("/v1",router);
}