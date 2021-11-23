const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const Models = require('./models.js');
const cors = require('cors');

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const { check, validationResult } = require('express-validator');

//mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true}); //to connect in local

mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true}); //to connect to heroku

const app = express();
//including CORS that allows all domain..

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//comment
const passport = require('passport');
require('./passport');
let auth = require('./auth')(app);

console.log('running')

//Return the list of ALL movies to the user.
app.get('/movies',/*passport.authenticate('jwt', { session: false }),*/(req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

//Return data about a single movie by title.
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ title: req.params.title })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});
    
//Return the list of ALL users.
app.get('/users',(req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

//Return data about ALL genres.
app.get('/genres', passport.authenticate('jwt', { session: false }), (req, res) => {
  Genres.find()
    .then((genre) => {
      res.status(201).json(genre);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

//Return data about a specific genre.
app.get('/genres/:genreName', passport.authenticate('jwt', { session: false }), (req, res) => {
    Genres.findOne({ genreName: req.params.genreName })
      .then((genre) => {
        res.json(genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

//Return a specif director by name.
app.get('/directors/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Directors.findOne({ name: req.params.name })
      .then((director) => {
        res.json(director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

//Adds a new movie to the list of movies 
/*app.post('/movies',(req,res) => {
    let newMovie = req.body;

    if(!newMovie.title){
        const message = 'Missing title in request body';
        res.status(400).send(message);
    }else{
        newMovie.id = uuid.v4();
        favMovies.push(newMovie);
        res.status(201).send(newMovie);
    }
});*/

//Allow new users to register (NO AUTHORIZATION).
app.post('/users', (req, res) => {
  let hashedPassword = Users.hashPassword(req.body.password);
  Users.findOne({ username: req.body.username }) // Search to see if a user with the requested username already exists
    .then((user) => {
      if (user) {
      //If the user is found, send a response that it already exists
        return res.status(400).send(req.body.username + ' already exists');
      } else {
        Users
          .create({
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email,
            birthday: req.body.birthday
          })
          .then((user) => { res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

//Allow new users to register NO AUTHORIZATION (without hashing)
/*app.post('/users', (req, res) => {
  Users.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.username + 'already exists');
      } else {
        Users
          .create({
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            birthday: req.body.birthday,
            favoriteMovies: req.body.favoriteMovies
          })
          .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});*/

//Allow users to update their user info.
app.put('/users/:username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ username: req.params.username }, { $set:
      {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        birthday: req.body.birthday,
        favoriteMovies: req.body.favoriteMovies
      }
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

//Delete a user by username.
app.delete('/users/:username', /*passport.authenticate('jwt', { session: false }),*/(req, res) => {
    Users.findOneAndRemove({ username: req.params.username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.username + ' was not found');
        } else {
          res.status(200).send(req.params.username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

//Add a movie to a user's list of favorites.
app.post('/users/:username/movies/:_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ username: req.params.username }, {
     $push: { favoriteMovies: req.params._id }
   },
   { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

//Allow users to remove a movie from their list of favorites.
app.delete('/users/:username/movies/:_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({username: req.params.username}, {
    $pull: {favoriteMovies: req.params._id}
  },
  {new: true},
  (err, updatedUser) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

app.get('/',(req,res) => {
    res.send('Welcome to my top 10 favorite movie list!');
});

app.use(express.static('public'));

app.use(morgan('common'));


app.use((err,req,res,next) => {
    console.error(err.stack);
    res.status(500).send('Something is wrong!');
});

const port = process.env.PORT || 8080 || 1234;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});

//To listen locally:
/*app.listen(8080,() => {
    console.log('Your app is listening on port 8080.');
});*/