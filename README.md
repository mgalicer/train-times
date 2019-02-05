# Train Times API
This API is a wrapper around the MTA's [GTFS specification](http://datamine.mta.info/). You can use it to:
1. Find the next trains coming to your station
2. Get a JSON object mapping train lines to their corresponding MTA feed id's.
3. Get a JSON object with relevant information for all MTA stops.  

This is a project built by [Mari](https://github.com/mgalicer) and [Patrick](https://github.com/merklebros).

## Set up the project
1. Clone the repo
```
git clone https://github.com/mgalicer/train-times.git
```

2. Install dependencies
[npm](https://www.npmjs.com/) 
[NodeJS](https://nodejs.org/en/)
```
cd train-times/
npm install
```

3. Register for an API key on the [MTA's website](https://datamine.mta.info/user/register)

4. Add your API key to the script
```
touch .env
echo "MTA_KEY=MY_MTA_KEY" >> .env
```

5. Add the port you want to use to develop locally
```
echo "PORT=3000" >> .env
```

6. Run the API
```
npm start
```

### Example endpoint:
##### Find the next train times for a given stop  
Say we're looking for the next A train times going south at Jay St. MetroTech. You can either go to ```http://localhost:3000/stops``` and look for your stop, or check out the stops.csv. At Jay St., the stop id is _A41_.

Next, pass the train line, stop id, and direction into the API:  
```localhost:3000/next-train-times/A/A41/S```

You should receive an array with the upcoming train arrival times.  
```
[8,14,22,32,45,55,65,75]
```
##### Get a JSON object with select information for all stops  
```localhost:3000/stops```
##### Get a JSON object with feed ids for all train lines  
```localhost:3000/line-to-feed-ids```
The returned object has keys that are train lines, ex `C`, and values that are an MTA feed ID, ex `26`