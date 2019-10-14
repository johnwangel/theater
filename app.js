const express = require('express');
const app = express();
app.use(express.static('public'));

const PORT = process.env.PORT || 3100;

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

const base = require('./routes/base');
app.use('/', base);

const artists = require('./routes/artists');
app.use('/artists', artists);

const auth = require('./routes/auth');
app.use('/auth', auth);

const locations = require('./routes/locations');
app.use('/locations', locations);

const prods = require('./routes/productions');
app.use('/productions', prods);

const search = require('./routes/search');
app.use('/search', search);

const shows = require('./routes/shows');
app.use('/shows', shows);

const theaters = require('./routes/theaters');
app.use('/theaters', theaters);

const venues = require('./routes/venues');
app.use('/venues', venues);

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});