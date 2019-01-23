const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const request = require('request');
const express = require('express');
const app = express();
const port = 3000;
require('dotenv').config();

app.get('/', async (req, res) => {
  let time = await getNextTrainTime();
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
    console.log(deltaTime.toString());
    deltaTimes.push(deltaTime);
  });

  return deltaTimes;
}