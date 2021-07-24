const https = require('https')
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

const functions = require('./routes/all_functions');

const base = require('./routes/base');
app.use('/', base);

const admin = require('./routes/admin');
app.use('/admin', admin);

const artists = require('./routes/artists');
app.use('/artists', artists);

const emails = require('./routes/emails');
app.use('/', emails);

const events = require('./routes/events');
app.use('/events', events);

const faves = require('./routes/faves');
app.use('/faves', faves);

const prods = require('./routes/productions');
app.use('/productions', prods);

const auth = require('./routes/auth');
app.use('/auth', auth);

const contact = require('./routes/contact');
app.use('/contact', contact);

const locations = require('./routes/locations');
app.use('/locations', locations);

const search = require('./routes/search');
app.use('/search', search);

const shows = require('./routes/shows');
app.use('/shows', shows);

const specialties = require('./routes/specialties');
app.use('/specialties', specialties);

const theaters = require('./routes/theaters');
app.use('/theaters', theaters);

const venues = require('./routes/venues');
app.use('/venues', venues);

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});