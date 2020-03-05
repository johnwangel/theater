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

// let modno=25;
// let list = [];
// for (var i = 4450 - 1; i >= 0; i--) {
//   if (i%modno===0) list.push(i);
// }


var query=`select id, name, city, state from theaters where state  in (1,2,3,4,12,19);`;
var pool = new Pool(creds);
pool.query(query, (err, _res) => {
  pool.end();
  let list=_res.rows;
  //do_theaters(list);
});


function do_theaters(list) {
  let proms=[];
  let theaters=[];
  list.forEach(item=>{
    let x = new Promise( (resolve, reject ) => getit(item.id,resolve,reject));
    proms.push(x);
  });

  Promise.all(proms).then( thtrs => {
    thtrs.forEach( item => { if(item)theaters.push(item); });
    //console.log(theaters);
    //send_emails(theaters);
  });
}

function getit(item,resolve,reject){
  var query=q.theater_mail(1);
  var vals = [item];
  var pool = new Pool(creds);
  pool.query(query, vals, (err, _res) => {
    pool.end();
    if (_res && _res.rows && _res.rows.length && _res.rows[0].email !== '' && _res.rows[0].email !== 'UNKNOWN' ) resolve(_res.rows[0]);
    resolve();
  });
}

function send_emails(t){
  t.forEach( (th,i) => {
    let theater=th;
    setTimeout(function(){send_email(theater)}, 1000*i);
  });
}

function send_email(th){
    // send({
    //         to: `${th.email}`,
    //         //to: 'info@stagerabbit.com',
    //         bcc: 'info@stagerabbit.com',
    //         subject: 'Get your theater company noticed at StageRabbit.com',
    //         html: intro_email(th),
    //       }, (error, result, fullResult) => {
    //         console.log(th.name,error);
    //         if (!error) log_email(1,th.id);
    //       });
}


function log_email(number,id){
  let query=q.log_sent_email();
  let vals=[number,id];
  var pool = new Pool(creds);
  pool.query(query, vals, (err, _res) => pool.end() );
  return true;
}

module.exports = emails;

function intro_email(d){
  var button_container=`style='display: flex;flex-direction:row;justify-content: center;align-items: center;width: 100%;border: unset;'`;
  var button=`style="text-deocoration:none;padding:15px;background-color:indigo;color:white;font-size: 1.5em;font-weight: bold;font-family: 'Raleway';margin: auto;border-radius: 10px;cursor: pointer;box-shadow: -2px 3px 5px grey;"`;


  let text = `<h2 style="font-weight:bold;padding: 15px 0;color:darkorchid;font-size:1.8em;font-family:'Raleway';border: unset;">Dear friends at ${d.name}:</h2>
          <p>I&rsquo;m writing because your Theater Company has been included on StageRabbit.com.
             You can view the entry here:

          <div ${button_container}>
            <a ${button} href='https://stagerabbit.com/theater/${d.id}'>View &ldquo;${d.name}&rdquo;</a>
          </div>

          <h2 style="font-weight:bold;padding: 15px 0;color:darkorchid;font-size:1.8em;font-family:'Raleway';border: unset;">What is StageRabbit?</h2>

          <p><a href="https://stagerabbit.com">StageRabbit.com</a> is a new website created specifically to connect lovers of <b>LIVE</b> theater with
          all of the theater options available in their area. We are building the most comprehensive database of live theater options
          across the country, including regional, community, university,
          youth and children&rsquo;s, as well as professional and non-professional tours.</p>

          <p>Local theater options are often very difficult to track down, especially for visitors
          to the area. So we are trying to make live theater easily discoverable. A simple search
          will provide theater-goers with all the information they need to discover great theater.</p>

          <p>Listing your theater company and production details is <b>ABSOLUTELY FREE</b>.
          That's so we can be sure to provide comprehensive listings. Our only requirement is
          that your listings are for THEATRICAL productions &mdash; musical theater, revues,
          or straight plays.</p>

          <p>We are writing to request your help
          in making our database as complete and accurate as possible.</p>

          <h2 style="font-weight:bold;padding: 15px 0;color:darkorchid;font-size:1.8em;font-family:'Raleway';border: unset;">Review Your Troupe Details</h2>

          <p>If any information is incorrect, or you would like to add more information (such as Productions), we have created an interface that makes it very simple for you to log in,
          review details about your theater company, and make updates yourself.</p>

          <p>Just <b>Register</b> for an account at <a href="https://stagerabbit.com/register">stagerabbit.com/register</a> using the following unique token: <b>${d.token}</b></p>

          <p>This token will provide you with exclusive access to edit and revise all information regarding your Theater Company.</p>

          <div style='display: flex;flex-direction:row;justify-content: center;align-items: center;width: 100%;border: unset;'>
            <a style="text-deocoration:none;padding:15px;background-color:indigo;color:white;font-size: 2em;font-weight: bold;font-family: 'Raleway';margin: auto;border-radius: 10px;cursor: pointer;box-shadow: -2px 3px 5px grey;" href='https://stagerabbit.com/register/${d.token}'>Register Now</a>
          </div>

          <p>Follow the instructions here (<a href="https://stagerabbit.com/instructions">stagerabbit.com/instructions</a>) for correcting or adding information.</p>

          <p>Any information you provide will be <b>immediately</b> available to users on the site.</p>

          <p>We hope you are as excited as we are about this opportunity to make theater easier to find.</p>

          <p>And we would love to hear from you with any ideas on how we can make the site even better!
             Just drop us a line at <a href='mailto:info@stagerabbit.com'>info@stagerabbit.com</a>

          <h2 style="font-weight:bold;padding: 15px 0;color:darkorchid;font-size:1.8em;font-family:'Raleway';border: unset;">
            Thank You!
          </h2>`;
  return template.basic(text);
}


