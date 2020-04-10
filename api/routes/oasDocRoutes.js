var express = require('express');
var router = express.Router()
require('dotenv').config();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger set up
const options = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "API Repository",
        version: "1.0.0",
        description:
          "Documentation API Repository",
        license: {
          name: "MIT",
          url: "https://choosealicense.com/licenses/mit/"
        },
        contact: {
          name: "Swagger",
          url: "https://swagger.io",
          email: "Info@SmartBear.com"
        },
      },
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
        // securitySchemes: {
        //   firebase: {
        //     "type": "http",
        //     "scheme": "bearer",
        //     "bearerFormat": "JWT",
        //     "description": "Custom token retrieved by logging in ('/login')",
        //   }
        // }
      },
      servers: [
        {
          url: process.env.urlApp || "http://localhost:8080/v1"
        }
      ]
    },
    apis: [//Add your file with swagger doc here
        "./api/models/userModel.js",
        "./api/models/restApiModel.js",
        "./api/models/providerModel.js",
        "./api/models/contributionHistoryModel.js",
        "./api/controllers/userController.js",
        "./api/controllers/restApiController.js",
        "./api/controllers/providerController.js",
        "./api/controllers/contributionHistoryController.js"
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
        explorer: true
    })
);

module.exports = function(app) {
  app.use("/v1",router);
}