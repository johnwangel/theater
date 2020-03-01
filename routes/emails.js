var express = require('express');
var emails = express.Router();

const Moment = require('moment');

const fetch=require('node-fetch');

const bodyParser = require('body-parser');
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

const template = require('../emails/templates');

var query=q.email_theater_info();
var vals = [2002];
var pool = new Pool(creds);
pool.query(query, vals, (err, _res) => {
  var data=_res.rows[0];
  pool.end();

  send({
        to: 'johnatkins1999@yahoo.com',
        subject: 'Introducting StageRabbit',
        html: intro_email(data),
      }, (error, result, fullResult) => {
        console.log(error,result,fullResult)
        // if (error) res.json({ message: 'Error.'});
        // var message = `ok`;
        // res.json({message});
      });



  // if (err){ res.json({  status: 'fail' } ); }
  // res.json({ status: 'success', data });
  return;
});



module.exports = emails;

function intro_email(d){
  let text = `<h1>Dear friends at ${d.name}:</h1>
          <p>I&rsquo;m writing to introduce you to an exciting new website,
          <a href="https://stagerabbit.com">StageRabbit.com</a>,
          which was created specifically to try to connect theater lovers with
          all of the theater options available in their area.</p>

          <p>We are building the most comprehensive database of live theater options
          across the country, including regional, community, university,
          youth and children&rsquo;s, as well as professional and non-professional tours.</p>

          <p>Local theater options are often very difficult to track down, especially for visitors
          to the area. So we are trying to make live theater easily discoverable. A simple search
          will provide theater-goers with all the information they need to discover great theater.</p>

          <p>Listing your theater company and production details is <b>ABSOLUTELY FREE</b>.
          so that we can be sure to provide comprehensive listings. Our only requirement is
          that your listings are for THEATRICAL productions &mdash; musical theater, revues,
          or straight plays.</p>

          <p>We are writing to request your help
          in making our database as complete and accurate as possible.</p>

          <div class='heading'>
            Verify Your Theater Company Details
          </div>

          <p>We have created an interface that makes it very simple for you to log in,
          review details about your theater company, and
          make updates yourself.</p>

          <p>Just <b>Register</b> for an account at <a href="https://stagerabbit.com/register">stagerabbit.com/register</a> using the following unique token: <b>${d.token}</b></p>

          <p>This token will provide you with exclusive access to edit and revise all information regarding your Theater Company.</p>

          <div class='button-container'>
            <a class='mybutton' href='https://stagerabbit.com/register/?tk=${d.token}'>Register Now</a>
          </div>

          <p>Follow the instructions here (<a href="https://stagerabbit.com/instructions">stagerabbit.com/instructions</a>) for correcting or adding information to our site.</p>

          <p>Any information you provide will be immediately available to users on the site.</p>

          <div class='heading'>
            Thank You!
          </div>

          <p>We hope you are as excited as we are about this opportunity to make theater more easily disoverable.</p>

          <p>And we would love to hear from you with any ideas on how we can make the site even better! Just drop us a line
          at <a href='mailto:info@stagerabbit.com'>info@stagerabbit.com</a>`;
  return template.basic(text);
}