var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

// define the schema for our user model
var userSchema = mongoose.Schema({

    nickname: {type: String, unique: true, required: true},
    //people who are following this user
    followers: [{type: ObjectId, ref: 'login'}],


    email        : {type: String, unique: true, required: true},
    password     : {type: String, unique: false, required: true},

    code     : {type: String, unique: true, required: false},

    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

});



// methods ======================
// generating a hash
userSchema.methods.generateHash = function(string) {
    return bcrypt.hashSync(string, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

//checking if code is valid
userSchema.methods.validCode = function(code) {
  if(this.code)
    return bcrypt.compareSync(code, this.code);
  else return false;
}


// create the model for users and expose it to our app
var Login = mongoose.model('login', userSchema);

module.exports = Login;
