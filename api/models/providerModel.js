var mongoose = require('mongoose');
var Schema = mongoose.Schema;
RestAPIs = require('./restApiModel');

/**
 * @swagger
 *  components:
 *    schemas:
 *      provider:
 *        type: object
 *        required:
 *          - name
 *        properties:
 *          _id:
 *            type: string
 *          name:
 *            type: string
 *            description: API name
 *            example: 'Twitter API'
 *          logo:
 *            type: array
 *            items:
 *              type: string
 *          description:
 *            type: string
 *            description: Provider description
 *            example: 'descTrip'
 *          externalLinks:
 *            type: array
 *            items:
 *              type: string
 *              pattern: /^http(s)?://([\w-]+.)+[\w-]+(/[\w- ./?%&=])?$/
 *              description: external references (websites) to the provider (main website for example, or urls of distincts projects that are relevant in the topic of Web APIs)
 *          blacklisted:
 *            type: boolean
 *            description: has this provider been blacklisted (if true, no operations can be made on this ressource or subsequents rssources other than by an administrator)
 *            example: false
 */
var providerSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: 'Enter the name of the provider please'
    }, logo: {
        data: Buffer,
        contentType: String
    }, description: {
        type: String
    }, externalLinks: [{
        type: String
    }], blacklisted: {
        type: Boolean,
        default: false
    }
}, { strict: true });

providerSchema.pre('deleteOne', async (callback) => {
    //Delete all object associated with this trip
    var providerId = this._conditions._id;
    await RestAPIs.find({ "provider_id": providerId }, (err, restApis) => {
        if(err) throw err;
        restApis.forEach(restApi => RestAPIs.deleteOne({ "_id": restApi }));
    });
    callback();
});

providerSchema.index({ 'blacklisted': -1 });

module.exports = mongoose.model('Providers', providerSchema);