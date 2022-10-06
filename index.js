const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const { Schema } = require('mongoose');
var bodyParser = require('body-parser');
require('dotenv').config();

const DB_CONNECT = process.env['db_full_connection']; 
mongoose.connect(DB_CONNECT);

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  log: [{
    description: String,
    duration: Number,
    date: String
  }],
  count: {
    type: Number,
    default: 0
  }
});
const User = mongoose.model('User', userSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.route('/api/users')
  .post(function(req, res) {
    const username = req.body.username;
    const user = new User({ username : username });
    user.save(function(err, data){
      if (err) { res.json({ error: err }) }
      res.json(data);
    })
  })
  .get(function(req, res) {
    User.find((err, data) => {
      if (data) {
        res.json(data);
      }
    })
  });


app.post('/api/users/:_id/exercises', function(req, res) {
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? 
    new Date(req.body.date).toDateString() :
    (new Date()).toDateString();
  const id = req.params._id;

  const exercise = {
    date,
    duration,
    description  
  };
  //add the exercise to the user log
  User.findByIdAndUpdate(id, 
                         { $push: { log : exercise } ,
                         $inc: { count: 1} },
                         {new: true},
                         function(err, user) {
    if (user) {
      const enteredExercise = {
        _id: id,
        username: user.username,
        ...exercise
      };
      res.json(enteredExercise);
    }
  });
});

  
app.get('/api/users/:_id/logs',function(req, res) {
  //const { from, to, limit } = req.query;
  
  User.findById(req.params._id, (req, user) => {
    if (user) {
      res.json(user);
    }
  })
});


//connection testing
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
app.get('/db-health', function(req, res) {
  res.json({ dbStatus: db.readyState });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
