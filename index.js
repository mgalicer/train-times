const fs = require('fs');
const parse = require('csv-parse')
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const request = require('request');
const dotEnv = require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 80;

let stops;
let lineToFeedId = buildFeedIds();
buildStops().then(function(data) {
  stops = data;
});

//Route to get Mari's train time
app.get('/mari-train-time', async (req, res) => {
  try {
    let times = getNextTrainTimes("C", "A44", "N");
    let time;
    if(times.length === 0) time = `{${(-1).toString()}}`;

    if(times[0] < 0 && times[1]) {
      time = `{${times[1].toString()}}`;
    } else {
      time = `{${times[0].toString()}}`;
    }

    res.send(time);
    return;
  } catch(e) {
    console.log(e);
    res.send(e);
  }
});

// Route to get next train times, where stations are stored on req.body.stations
//TODO: Test next train times with front end http request
app.get('/next-train-times/:line/:station/:direction', async (req, res) => {
  try {
    let line = req.params.line;
    let station = req.params.station;
    let direction = req.params.direction;
    let times = await getNextTrainTimes(line, station, direction);
    res.send(times);
  }
  catch(e) {
    console.log(e);
    res.send(e)
  }
});

app.get('/line-to-feed-ids', async (req, res) => {
  try {
    res.send(lineToFeedId);
  }
  catch(e) {
    console.log(e);
    res.send(e)
  }
});

app.get('/stops', async (req, res) => {
  try {
    res.send(stops);
  }
  catch(e) {
    console.log(e);
    res.send(e)
  }
});

app.listen(port, () => console.log(`App listening on port ${port}!`))

async function getNextTrainTimes(trainLine, stopId, direction) {

    let errorMessage = validateInputs(trainLine, stopId, direction);
    let feedId = lineToFeedId[trainLine];
    if(errorMessage.length !== 0) {
      return errorMessage;
    }

    let body = await makeRequest(trainLine);
    let feed = GtfsRealtimeBindings.FeedMessage.decode(body);
    let arrivalTimes = parseArrivalTimes(feed, trainLine, stopId, direction);
    let deltaTimes = formatArrivalTimes(arrivalTimes);

    return deltaTimes;

}

function parseArrivalTimes(feed, trainLine, stopId, direction) {
  let arrivalTimes = [];
  feed.entity.forEach((entity) => {
    let tripUpdate = entity.trip_update;
    if (tripUpdate && tripUpdate.trip.route_id === trainLine){
      tripUpdate.stop_time_update.forEach((update) => {
          if(update.stop_id === stopId + direction) {
            let time = update.arrival.time.low*1000;
            arrivalTimes.push(time);
          }
        })
      }

    });

  arrivalTimes.sort();
  return arrivalTimes;
}

function makeRequest(trainLine) {
  let feedId = lineToFeedId[trainLine];
  let requestSettings = {
    method: 'GET',
    url: `http://datamine.mta.info/mta_esi.php?key=${process.env.MTA_KEY}&feed_id=${feedId}`,
    encoding: null
  };

  return new Promise(function(resolve, reject) {
    request(requestSettings, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

function validateInputs(trainLine, stopId, direction) {
  let feedId = lineToFeedId[trainLine];
  if(!feedId) {
    return "Invalid train line provided." ;
  }
  if(!stops[stopId]) {
    return "Invalid stop id provided.";
  }
  if(direction !== "N" && direction !== "S" && !direction) {
    return "Invalid direction.";
  }
  return "";
}

function formatArrivalTimes(arrivalTimes) {
  let deltaTimes = [];
  arrivalTimes.forEach((time) => {
    let arrival = new Date(time);
    let deltaTime = Math.floor((arrival - Date.now())/60000);
    if(deltaTime > 0) deltaTimes.push(deltaTime);
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
          return;
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
