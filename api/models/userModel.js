var mongoose = require('mongoose')
var mongodb = require('mongodb');
var Schema = mongoose.Schema;

var bcrypt = require('bcrypt');

/**
 * @swagger
 *  components:
 *    schemas:
 *      user:
 *        type: object
 *        required:
 *          - username
 *          - email
 *          - password
 *          - role
 *        properties:
 *          _id:
 *            type: string
 *          username:
 *            type: string
 *          email:
 *            type: string
 *          password:
 *            type: string
 *            format: password
 *          role:
 *            type: string
 *            enum: [Administrator, Contributor]
 *          description:
 *            type: string
 *          banned:
 *            type: boolean
 *          created_at:
 *            type: string
 *            format :date
 *          __v:
 *            type: integer
 */
var userModel = new Schema({
    username: {
        type: String,
        required: 'Enter the username of the user please'
    }, email: {
        type: String,
        required: 'Enter the email of the user please',
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
        unique: true
    }, password: {
        type: String,
        required: 'Enter the password of the user please'
    }, role: {
        type: String,
        required: 'Enter the role of the user please',
        enum: ['Administrator', 'Contributor']
    }, description: {
        type: String,
        default: null
    }, banned: {
        type: Boolean,
        default: false
    }, contributions: [{
        type: mongodb.ObjectID
    }], createdAt: {
        type:Date,
        default: Date.now
    }
}, {
    strict: false
})

userModel.pre('save', function(callback) {
    var user = this;
    // Break out if the password hasn't changed
    if (!user.isModified('password')) return callback();
    // Password changed so we need to hash it
    bcrypt.genSalt(5, function(err, salt) {
        if (err) return callback(err);
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return callback(err);
            user.password = hash;
            callback();
        });
    });
});

  
userModel.methods.verifyPassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        console.log('verifying password in userModel: ' + password);
        if (err) return cb(err);
        console.log('iMatch: ' + isMatch);
        cb(null, isMatch);
    });
};
  

module.exports = mongoose.model ('Users', userModel);