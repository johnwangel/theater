var express = require('express');
var contact = express.Router();

const bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const q = require('../queries/queries.js');
const tokens = require('../constants/tokens.js');
const { Pool, Client } = require('pg');
const creds = tokens.db_creds;

const send = require('gmail-send')({
  user: tokens.google.user,
  pass: tokens.google.pass,
  to: '',
  subject: ''
});

//send email
contact.post('/', jsonParser, (req, res) => {
  send({
    to: 'info@stagerabbit.com',
    subject: `User Email: ${req.body.subject_select}`,
    html: `<p>From: ${req.body.name}</p>
           <p>Email: ${req.body.email}</p>
           <p>Message: ${req.body.message}</p>`,
  }, (error, result, fullResult) => {
    if (error) res.json({ status: 'fail'});
    res.json({status:'success'});
  });
  //const msg=[ req.body.name, req.body.email, req.body.subject_select, req.body.message ];
  // var query=q.email_save();
  // var pool = new Pool(creds);
  // pool.query(query, msg, (err, _res) => {
  //   var data=_res.rows;
  //   pool.end();
  //   if (err){ res.json({  status: 'fail' } ); }
  //   res.json({ status: 'success' });
  //   return;
  // });
});

//get emails
contact.get('/', (req, res) => {
  var query=q.email_get();
  var pool = new Pool(creds);
  pool.query(query, (err, _res) => {
    var data=_res.rows;
    pool.end();
    if (err){ res.json({  status: 'fail' } ); }
    res.json({ status: 'success', data });
    return;
  });
});

module.exports = contact;