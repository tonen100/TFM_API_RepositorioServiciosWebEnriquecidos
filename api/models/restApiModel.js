var mongoose = require('mongoose');
var mongodb = require('mongodb');
var Schema = mongoose.Schema;
var oas2SchemaOrg = require('oas2schema.org');

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
 *            type: object
 *            description: The API documentation in OASv3 format (can be generated from the originalDoumentation attribute)
 *          metadata:
 *            type: object
 *            description: The WebAPI instance of Schema.org generated from the oasDocumentation
 *          description:
 *            type: string
 *            description: A description of this version specificities (compared to the other versions)
 *          deprecated:
 *            type: boolean
 *            description: has this version been deprecated
 *          blackListed:
 *            type: boolean
 *            description: has this API version been blacklisted (if true, no operations (even GET) can be made on this ressource other than by an administrator)
 */
var versionSchema = new Schema({
    number: {
        type: String,
        required: 'Enter the number of this API version please'
    }, originalDocumentation: {
        type: String
    }, oasDocumentation: {
        type: Object,
        required: 'Enter the OASv3 documentation of this API version please'
    }, metadata: {
        type: Object,
        required: 'Enter the metadata of this API version please'
    }, description: {
        type: String,
        required: 'Enter the description of this API version please'
    }, deprecated: {
        type: Boolean,
        default: false
    }, blackListed: {
        type: Boolean,
        default: false
    }
}, { strict: false, id: false });
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
 *          logo:
 *            type: array
 *            items:
 *              type: string
 *          businessModels:
 *            type: string
 *            description: List of the type of offers available for consumers
 *            enum: ['Free', 'FreeWithLimitations', 'FreeTrialVersion', 'FlatRateAllInclusive', 'FlatRatesWithLimitations', 'Billing']
 *          blackListed:
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
        required: 'Enter the name of the API please'
    }, logo: {
        data: Buffer,
        contentType: String
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
    }], blackListed: {
        type: Boolean,
        default: false
    }, versions: [
        versionSchema
    ], provider_id: {
        type: mongodb.ObjectID,
    }
}, { strict: true });

versionSchema.pre('save', async (callback) => {
    var new_api = this;

    if(new_api.originalDocumentation) {
        try {
            new_api.oasDocumentation = await oas2SchemaOrg.oasConverter.convertToOASv3(originalDocumentation)
        } catch (err) {
            console.log(err);
        }
    }

    if(new_api.oasDocumentation) {
        try {
            new_api.metadata = oas2SchemaOrg.convertToMetadata(new_api.oasDocumentation, "OASv3", { urlAPI: new_api.urlAPI, urlDoc: new_api.urlDoc });
            delete new_api.urlAPI;
            delete new_api.urlDoc;
        } catch(err) {
            console.log(err);
        }
    }
    callback();
});

restApiSchema.pre('deleteOne', async function(callback){
    //Delete all object associated with this trip
    var restApiId = this._conditions._id;
    await Versions.deleteMany({restApi_Id: restApiId} ,(err) => {
        if(err) throw err;
    });
    callback();
});

module.exports = mongoose.model('RestApis', restApiSchema);