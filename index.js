const dotEnv = require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 80;
const trainUtils = require('./trainUtilities');
let stops;
let lineToFeedId;

async function init() {
 stops = await trainUtils.buildStopData();
 lineToFeedId = trainUtils.buildFeedData();
}

// Route to get next train times, where stations are stored on req.body.stations
//TODO: Test next train times with front end http request
app.get('/next-train-times/:line/:station/:direction', async(req, res) => {
  try {
    let line = req.params.line;
    let station = req.params.station;
    let direction = req.params.direction;
    let times = await trainUtils.getNextTrainTimes(line, station, direction);
    res.send(times);
  }
  catch(e) {
    console.log(e);
    res.send('Error');
  }
});

app.get('/next-bus-times/:line/:stop', async(req, res) => {
  try {
    let {line, stop} = req.params;
    let times = await trainUtils.getNextBusTimes(line, stop);
    res.send(times);
  }
  catch(e) {
    console.log(e);
    res.send('Error');
  }
});

app.get('/line-to-feed-ids', (req, res) => {
  try {
    res.send(lineToFeedId);
  }
  catch(e) {
    console.log(e);
    res.send('Error')
  }
});

app.get('/stops', (req, res) => {
  try {
    res.send(stops);
  }
  catch(e) {
    console.log(e);
    res.send('Error')
  }
});

app.get('*', (req, res) => {
  res.status(404).send('Error');
})

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Error')
})

app.listen(port, () => console.log(`App listening on port ${port}!`))

init();
