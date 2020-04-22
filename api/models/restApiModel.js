var mongoose = require('mongoose');
var mongodb = require('mongodb');
var Schema = mongoose.Schema;

/**
 * @swagger
 *  components:
 *    schemas:
 *      version:
 *        type: object
 *        required:
 *          - number
 *          - description
 *        properties:
 *          _id:
 *            type: string
 *          number:
 *            type: string
 *            description: Number of release of the version. Advised to respect semver specification
 *            example: 'v1.0.0'
 *          originalDocumentation:
 *            type: string
 *            description: The valid RESTfull API description made in any of the supported languages (OASv2, OASv3, RAMLv1, API Blueprint)
 *          oasDocumentation:
 *            type: string
 *            description: The API documentation in OASv3 format (will be be generated from the originalDoumentation attribute)
 *          metadata:
 *            type: object
 *            description: The WebAPI instance of Schema.org generated from the oasDocumentation
 *          description:
 *            type: string
 *            description: A description of this version specificities (compared to the other versions)
 *          deprecated:
 *            type: boolean
 *            description: has this version been deprecated
 *          blacklisted:
 *            type: boolean
 *            description: has this API version been blacklisted (if true, no operations (even GET) can be made on this ressource other than by an administrator)
 *          createdAt:
 *            type: string
 *            format: date
 */
var versionSchema = new Schema({
    number: {
        type: String,
        required: 'Enter the number of this API version please'
    }, originalDocumentation: {
        type: String,
        required: 'Enter the documentation of this API version please'
    }, oasDocumentation: {
        type: String,
    }, metadata: {
        type: Object,
    }, description: {
        type: String,
        required: 'Enter the description of this API version please'
    }, deprecated: {
        type: Boolean,
        default: false
    }, blacklisted: {
        type: Boolean,
        default: false
    }, createdAt: {
        type: Date,
        default: Date.now
    }
}, { strict: false });
mongoose.model('Versions', versionSchema);
Versions = mongoose.model('Versions');

/**
 * @swagger
 *  components:
 *    schemas:
 *      restAPI:
 *        type: object
 *        required:
 *          - name
 *          - businessModels
 *        properties:
 *          id:
 *            type: string
 *          name:
 *            type: string
 *            description: API name
 *            example: 'Twitter API'
 *          metadata:
 *              type: object          
 *          logoUrl:
 *            type: string
 *            pattern: /^http(s)?://([\w-]+.)+[\w-]+(/[\w- ./?%&=])?$/
 *            description: Absolute URL to the logo of the API
 *          businessModels:
 *            type: string
 *            description: List of the type of offers available for consumers
 *            enum: ['Free', 'FreeWithLimitations', 'FreeTrialVersion', 'FlatRateAllInclusive', 'FlatRatesWithLimitations', 'Billing']
 *          blacklisted:
 *            type: boolean
 *            description: has this API been blacklisted (if true, no operations can be made on this ressource or subsequents rssources other than by an administrator)
 *            example: false
 *          versions:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/version'
 *          provider_id:
 *            type: string
 */
var restApiSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: 'Enter the name of the API please'
    }, metadata: {
        type: Object
    }, logoUrl: {
        type: String
    }, businessModels: [{
        type: String,
        enum: [
            'Free',
            'FreeWithLimitations',
            'FreeTrialVersion',
            'FlatRateAllInclusive',
            'FlatRatesWithLimitations',
            'Billing'
        ]
    }], blacklisted: {
        type: Boolean,
        default: false
    }, versions: [
        versionSchema
    ], provider_id: {
        type: mongodb.ObjectID,
    }
}, { strict: true });

restApiSchema.pre('deleteOne', async function(callback){
    //Delete all object associated with this trip
    var restApiId = this._conditions._id;
    await Versions.deleteMany({restApi_Id: restApiId} ,(err) => {
        if(err) throw err;
    });
    callback();
});

restApiSchema.index({ 'blacklisted': -1, 'name': 1 });
restApiSchema.index({ 'blacklisted': -1, 'provider_id': 1 });
restApiSchema.index({ 'blacklisted': -1, 'business_models': 1, 'name': "text", 'description': "text" });

module.exports = mongoose.model('RestApis', restApiSchema);