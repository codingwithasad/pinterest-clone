const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb+srv://mughalasad449:jxJTDVqqMauE7DaR@cluster0.pq60yp3.mongodb.net/pinterestclone?retryWrites=true&w=majority");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String
  },
  username: {
    type: String
  },
  email: {
    type: String
  },
  password: {
    type: String
  },
  gender: {
    type: String
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
  dp: {
    type: String, // Assuming the profile picture URL is a string
  }
});
userSchema.plugin(plm)
const User = mongoose.model('User', userSchema);

module.exports = User;