'use strict'

//load environment variables from the .env file
require('dotenv').config();

// application Dependencies
const express = require('express');
const app = express();
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const PORT = process.env.PORT;
app.use(cors());

app.get('/testing', (request, response) => {
  console.log('found the testing route');
  response.send('<h1> HEY WORLD </h1>');
});
//if you call a function with .get it is already expecting a function so you dont need to add the parameters.

//API Routes
app.get('/location', searchToLatLong)
app.get('/weather', searchForWeatherAndTime)
app.get('/events', searchForEvents)

app.listen(PORT, () => console.log(`Listen on Port NEW ${PORT}.`));

//Helper Functions
//Dealing With Geo Data
function searchToLatLong(request, response) {
  console.log('LOCATIONSSSS');
  const geoData = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  superagent.get(geoData)
    .then(result => new Location(result.body))
    .then(location => response.send(location))
    .catch(error => console.error('Error: ', error))
}

function Location(data) {
  this.formatted_query = data.results[0].formatted_address;
  this.latitude = data.results[0].geometry.location.lat;
  this.longitude = data.results[0].geometry.location.lng;
}

//Dealing With Weather
function searchForWeatherAndTime(request, response) {
  const weatherUrl = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  console.log('HELLO????');
  superagent.get(weatherUrl)
    .then(function(result) {
      let weatherSummary = [];
      result.body.daily.data.forEach((element) => {
        let weather = new Weather(element);
        weatherSummary.push(weather);
      })
      return weatherSummary;
    })
    .then(weather => response.send(weather))
    .catch(error => console.error('Error: ',error))
}

function Weather(data) {
  this.time = new Date(data.time*1000).toString();
  this.forecast = data.summary;
}

//Dealing With Events Data
function searchForEvents(request, response) {
  const eventsUrl = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${request.query.data.latitude}&location.longitude=${request.query.data.longitude}&token=${process.env.EVENTBRITE_API_KEY}`
  superagent.get(eventsUrl)
    .then(function(result) {
      console.log(result.body.events)
      let eventsSummary = [];
      result.body.events.forEach((element) => {
        let newEvent = new Events(element);
        eventsSummary.push(newEvent);
      })
      return eventsSummary;
    })
    .then(event => response.send(event))
    .catch(error => console.error('Error: ',error))

}

function Events(data){
  this.link = data.url;
  this.name = data.name.text
  this.event_date = data.start.local
  this.summary = data.summary
}
