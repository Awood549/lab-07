'use strict'

//load environment variables
require('dotenv').config();

const express = require('express');

const app = express();

const cors = require('cors');

app.use(cors());

const PORT = process.env.PORT;

app.get('/testing', (request, response) => {
  console.log('found the testing route');
  response.send('<h1> HEY WORLD </h1>');
});
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
function searchToLatLong(request, response) {
  const geoData = require('./data/geo.json');
  const location = new Location(geoData);
  console.log(location);
  return location;
}

function Location(data) {
  this.formatted_query = data.results[0].formatted_address;
  this.latitude = data.results[0].geometry.location.lat;
  this.longitude = data.results[0].geometry.location.lng;
}

function searchForWeatherAndTime(query) {

  const weatherSummary = [];

  console.log(weatherSummary);

  const weatherData = require('./data/darksky.json');

  weatherData.daily.data.forEach((element) => {
    let weather = new Weather(element);
    weatherSummary.push(weather);
  });

  console.log(weatherSummary);

  return weatherSummary;
}

function Weather(data) {
  this.time = new Date(data.time*1000).toString();
  this.forecast = data.summary;
}



