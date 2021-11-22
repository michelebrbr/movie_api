const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let movieSchema = mongoose.Schema({
    title: {type: String, required: true},
    director: {
        name: String,
        birth_year: Number,
        bio: String
    },
    genre: {type: mongoose.Schema.Types.ObjectId, ref: "Genre"},
    description: {type: String, required: true},
    actors: [String], //{type: mongoose.Schema.Types.ObjectId, ref: "Actor"}, (Actor collection to be made)
    ImagePath: String,
    Featured: Boolean
});

let userSchema = mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    birthday: Date,
    favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
  };
  
  userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.Password);
  };

let genreSchema = mongoose.Schema({
    genreName: {type: String, required: true},
    genreDescription: {type: String, required: true}
});

let directorSchema = mongoose.Schema({
    name: {type: String, required: true},
    bio: {type: String, required: true},
    birthdate: {type: Date, required: true},
    films: [{type: mongoose.Schema.Types.ObjectId, ref: "Movie"}]
});

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);
let Genre = mongoose.model('Genre', genreSchema);
let Director = mongoose.model('Director', directorSchema);

module.exports.Movie = Movie;
module.exports.User = User;
module.exports.Genre = Genre;
module.exports.Director = Director;