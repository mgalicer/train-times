const fs = require('fs'); 
const parse = require('csv-parse')
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const request = require('request');
const dotEnv = require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;

//Route to get Mari's train time
app.get('/', async (req, res) => {
  let time = await getNextTrainTime();
  res.send(time.toString());
})

//Route to get next train times, where stations are stored on req.body.stations
app.get('/next-train-times', async (req, res) => {
  let stations = req.body.stations;
  // let time = await getNextTrainTime(); TODO: Replace with general getNextTrainTime function
  res.send(time.toString());
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

function getNextTrainTime() {
  return new Promise(function(resolve, reject) {
    let requestSettings = {
      method: 'GET',
      url: `http://datamine.mta.info/mta_esi.php?key=${process.env.MTA_KEY}&feed_id=26`,
      encoding: null
    };

    request(requestSettings, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        let feed = GtfsRealtimeBindings.FeedMessage.decode(body);
        let arrivalTimes = [];
        feed.entity.forEach((entity) => {
          
          let tripUpdate = entity.trip_update;
          if (tripUpdate && tripUpdate.trip.route_id ==="C") {
            tripUpdate.stop_time_update.forEach((update) => {
                if(update.stop_id === "A44N") {
                  let time = update.arrival.time.low*1000;
                  arrivalTimes.push(time);
                }
              })
            }
            
          });
        arrivalTimes.sort();
        let deltaTimes = formatArrivalTimes(arrivalTimes);
        if(deltaTimes[0] < 0 && deltaTimes[1]) {
          resolve(deltaTimes[1]);
        }
        else {
          resolve(deltaTimes[0]);
        }
      }
    });
    
  });
}

function formatArrivalTimes(arrivalTimes) {
  let deltaTimes = [];
  arrivalTimes.forEach((time) => {
    let arrival = new Date(time);
    let deltaTime = Math.floor((arrival - Date.now())/60000);
    deltaTimes.push(deltaTime);
  });
  
  return deltaTimes;
}

function buildStops() {
  return new Promise(function(resolve, reject) {

    let stops = {};
    fs.createReadStream("stops.csv")
        .pipe(parse({delimiter: ','}))
        .on('data', function(csvrow) {
          let stop = {
            stationId: csvrow[0],
            complexId: csvrow[1],
            stopId: csvrow[2],
            division: csvrow[3],
            line: csvrow[4],
            stopName: csvrow[5],
            borough: csvrow[6],
          }
          stops[stop.stopId] = stop;
        })
        .on('end',function() {
          resolve(stops);
        });
  });
}

function buildFeedIds() {
  //NOTE S LINE IS ALSO INCLUDED IN ACEH DATA, include S in that array to see S data
  let lineToFeedId = {};
  ["1","2","3","4","5","6","S"].forEach((line) => {
    lineToFeedId[line] = 1;
  });
  ["A","C","E","H"].forEach((line) => {
    lineToFeedId[line] = 26;
  });
  ["N","Q","R","W"].forEach((line) => {
    lineToFeedId[line] = 16;
  });
  ["B","D","F","M"].forEach((line) => {
    lineToFeedId[line] = 21;
  });
  ["J", "M"].forEach((line) => {
    lineToFeedId[line] = 36;
  });
  lineToFeedId["L"] = 2;
  lineToFeedId["SIR"] = 11;
  lineToFeedId["G"] = 31;
  lineToFeedId["7"] = 51;

  return lineToFeedId;
}

let stops = buildStops();
let lineToFeedId = buildFeedIds();