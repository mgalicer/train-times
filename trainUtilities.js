const fs = require('fs');
const parse = require('csv-parse');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const request = require('request');
const dotEnv = require('dotenv').config();


let stops;
let lineToFeedId;

function buildStopData() {
  return new Promise((resolve) => {
    buildStops()
      .then(function(data) {
        stops = data;
        resolve(data);
    });
  });
}

function buildFeedData() {
  lineToFeedId = buildFeedIds();
  return lineToFeedId;
}

async function getNextTrainTimes(trainLine, stopId, direction) {
  let errorMessage = validateInputs(trainLine, stopId, direction);
  let feedId = lineToFeedId[trainLine];
  if(errorMessage.length !== 0) {
    return errorMessage;
  }

  let body = await makeRequest(trainLine)
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
    console.log((arrival - Date.now())/60000)
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

module.exports = {
  getNextTrainTimes: getNextTrainTimes,
  parseArrivalTimes: parseArrivalTimes,
  makeRequest: makeRequest,
  validateInputs: validateInputs,
  formatArrivalTimes: formatArrivalTimes,
  buildStops: buildStops,
  buildFeedIds: buildFeedIds,
  buildStopData: buildStopData,
  buildFeedData: buildFeedData
}
