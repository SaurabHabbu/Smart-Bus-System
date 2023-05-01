/* const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyBXimlauknGEyl2PSJeTTh8ykMZVUNUn8E',
});

function arrival_time1(callback) {
   
  const origin = '15.827154, 74.499505';
  const destination = '15.860443, 74.507648';
  const mode = 'driving';
  
  googleMapsClient.directions({
    origin: origin,
    destination: destination,
    mode: mode,
  }, (err, response) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(response.json.routes[0].legs[0].distance);
    return callback(null, response.json,mode);
    const route = response.json.routes[0];
    const duration = route.legs[0].duration.text;
    console.log(`The estimated travel time from ${origin} to ${destination} is ${duration}`);
  });
 
}

function processJSONData(error, jsonData,mode) {
  if (error) throw error;
  console.log(mode);
}

arrival_time1(processJSONData);

  
function otherfunc(){
var json_got = arrival_time1();
console.log(json_got);
}

 */

function myFunction() {
  var myVariable = 'Hello World!';

  function innerFunction() {
    console.log(myVariable);
  }

  return innerFunction;
}

var closure = myFunction();
closure(); // Output: Hello World!
