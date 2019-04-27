'use strict'

//load environment variables from the .env file
require('dotenv').config();

// application Dependencies
const express = require('express');
const app = express();
const cors = require('cors');
const superagent = require('superagent');

const pg = require('pg');

// Application Setup
const PORT = process.env.PORT;
app.use(cors());

app.get('/testing', (request, response) => {
  console.log('found the testing route');
  response.send('<h1> HEY WORLD </h1>');
});


// FOR THE .Env File DATABASE_URL=postgres://<user-name>:<password>/@localhost:5432/city_explorer
//User and pass comes from postgres
//Connect to the DB
const client = new pg.Client(process.env.DATABASE_URL);           //brings in the ability to access the postgres db
client.connect();                           //connects all the info built out to the db you have to start postgres before your server
client.on('error', err => console.log(err));              //this catches the error if you dont start postgres before the server.

//if you call a function with .get it is already expecting a function so you dont need to add the parameters.

//API Routes
app.get('/location', searchToLatLong)

app.get('/weather', (request, response) => {
  console.log('From weather request', request.query.data.latitude);
  try {
    const newWeatherData  = searchForWeatherAndTime(request.query.data.formatted_query);
    response.send(newWeatherData);
  }
  catch (error) {
    console.error(error);
    response.status(500).send('Status: 500. I don\'t know what happen man!');
  }
});

app.listen(PORT, () => console.log(`Listen on Port ${PORT}.`));

//Helper Functions

function searchToLatLong(request, response){
  let query = request.query.data;
  //define the search query for sql
  let sql = `SELECT * FROM locations WHERE search_query=$1;`;
  let values = [query];

  //make a query of the DB
  client.query(sql,values)
  .then(result => {
    //did the DB return any info?
    if(result.rowCount > 0){
      console.log('HOW MANY ROWS DOE?', result.rows[0])
      response.send(result.rows[0]);
    } else{
      //if there was nothing in the DB go get the info
        const geoData = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  superagent.get(geoData)

    .then(result => {
      if (!result.body.results.length) {throw 'NO DATA';}
      else{
        let location = new Location(result.body.results[0]);
        let newSQL = `INSERT INTO locations (search_query, formatted_address, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING ID;`;
        let newValues = Object.values(location);
        client.query(newSQL, newValues)
        .then(data => {
          //attatch the returning ID to the location object
          location.id = data.rows[0].id;
          response.send(location);
        });
      }
    })
    .catch(error => console.error('Error: ', error));
  }
});
}

function Location(data) {
  this.formatted_query = data.results[0].formatted_address;  
  this.latitude = data.results[0].geometry.location.lat;
  this.longitude = data.results[0].geometry.location.lng;
}

function searchForWeatherAndTime(request,response) {
  let query = request.query.data.id;
  let sql = `SELECT * FROM locations WHERE search_query=$1;`;
  let values = [query];

  client.query(sql, values)
  .then(result => {
    if (result.rowCount > 0) {
      console.log('Weather From SQL');
      response.send(result.rows);
    } else{
      const url = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/37.8267,-122.4233`;
      return superagent.get(url)
      .then(weatherResults => {
        if(!weatherResults.body.daily.data.length) { throw 'NO DATA';}
        else{
          const weatherSummaries = weatherResults.body.data.map(day => {
            let summary = new Weather(day);
            summary.id = query;
            
          });
        }
      })
    }
  })

}

function Weather(data) {
  this.time = new Date(data.time*1000).toString();
  this.forecast = data.summary;
}
