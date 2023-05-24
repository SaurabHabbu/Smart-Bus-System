const express = require("express");
const distance = require("googlemaps/lib/distance");
const mysql = require("mysql");
const googleMapsClient = require("@google/maps").createClient({
  key: "AIzaSyBXimlauknGEyl2PSJeTTh8ykMZVUNUn8E",
});
const axios = require("axios");

const baseFare = 2.5;
const farePerKm = 2.0;
const peakHourSurcharge = 1.0;

const app = express();

app.use(express.json());
// MySQL database configuration
const connection = mysql.createConnection({
  host: "sql12.freesqldatabase.com",
  user: "sql12620186",
  password: "tzX9QLV3NN",
  database: "sql12620186",
});

function dateandtime() {
  let date_time = new Date();
  let date = ("0" + date_time.getDate()).slice(-2);
  let month = ("0" + (date_time.getMonth() + 1)).slice(-2);

  let year = date_time.getFullYear();
  let hours = date_time.getHours();
  let minutes = date_time.getMinutes();
  let seconds = date_time.getSeconds();

  var datetime =
    year +
    "-" +
    month +
    "-" +
    date +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds;

  return datetime;
}

var dt = dateandtime();

console.log(dt);
// Connect to MySQL database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database: ", err);
    return;
  }
  console.log("Connected to MySQL database!");
});
app.get("/", (req, res) => {
 
  
    res.send("itsme saurab habbu");
 
});
// API route to get a specific parameter
app.get("/user_fetch/:emailid", (req, res) => {
  const emailid = req.params.emailid;
  const sql = `SELECT * FROM register WHERE email = '${emailid}'`;
  connection.query(sql, (err, [result]) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).send("Error executing MySQL query");
      return;
    }
    res.send(result);
  });
});

app.get("/bus_fetch",(req, res) => {
  const sql = `SELECT * FROM bus_info `;
  connection.query(sql, (err, [result]) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).send("Error executing MySQL query");
      return;
    }

    res.send(result)

});
});


app.get("/user_history/:rfidno", (req, res) => {
 
  const rfidno = req.params.rfidno;
  const sql = `SELECT * FROM user_travel WHERE rfidno = '${rfidno}'`;
  connection.query(sql, (err, result) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).send("Error executing MySQL query");
      return;
    }
    
    res.send(result)
   
 
});
});



app.get("/:rfidno", (req, res) => {
  const rfidno = req.params.rfidno;
  const sql = `SELECT * FROM register WHERE rfidno = '${rfidno}' `;

  connection.query(sql, (err, result) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).send("Error executing MySQL query");
      return;
    }
    res.send("true");
  });
});

app.get("/tapout/:rfidno", (req, res) => {
  const rfidno = req.params.rfidno;
  const sql = `SELECT id FROM user_travel WHERE rfidno = '${rfidno}' and tap_out = '0' `;

  connection.query(sql, (err, [result]) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).send("Error executing MySQL query");
      return;
    }

    res.send(result);
    //console.log(result[0]);
  });
});

app.post("/bus_location_update", (req, res) => {
  const data = req.body;

  const sql = `UPDATE bus_info SET lat = '${data["lat"]}' , longi = '${data["long"]}' WHERE unique_no = '${data["bus_uniqueno"]}'`;

  connection.query(sql, (err, result) => {
    if (err) {
      console.error("error", err);
      res.status(500).send("error executing MYSQL query");
      return;
    }
    res.send("true");
    //console.log(data["lat"]);
  });
});

app.post("/user_travel_init", (req, res) => {
  const data = req.body;
  console.log(data);
  var datetime = dateandtime();
  const sql = `INSERT INTO user_travel (rfidno, bus_uniqueno, in_lat , in_long  , tap_in , tap_out , date) VALUES ('${data["rfidno"]}', '${data["bus_uniqueno"]}', '${data["inlat"]}' , '${data["inlong"]}', '1' , '0', '${datetime}')`;
  //let values = [1,data["rfidno"],data["bus_uniqueno"],data["inlat"],data["inlong"],data["inlat"],data["inlong"],1,0,"None", "dsf"];

  connection.query(sql, (err, result) => {
    if (err) {
      console.error("error", err);
      res.status(500).send("error executing MYSQL query");
      return;
    }
    //console.log(data["rfidno"]);
  });
  res.send(true);
});

app.post("/user_tapout", (req, res) => {
  const data = req.body;
  var rfidno = data["rfidno"];
  var travel_id = data["travel_id"];
  console.log(data);
  var datetime = dateandtime();
  const sql = `UPDATE  user_travel SET  out_lat = '${data["outlat"]}' , out_long = '${data["outlong"]}'  , tap_out = '1' WHERE rfidno = '${data["rfidno"]}' and bus_uniqueno = '${data["bus_uniqueno"]}' and id = '${data["travel_id"]}' `;
  //let values = [1,data["rfidno"],data["bus_uniqueno"],data["inlat"],data["inlong"],data["inlat"],data["inlong"],1,0,"None", "dsf"];

  connection.query(sql, (err, result) => {
    if (err) {
      console.error("error", err);
      res.status(500).send("error executing MYSQL query");
      return;
    }
  });

  res.send(true);
  const sql1 = `SELECT in_lat,in_long,out_lat,out_long FROM user_travel WHERE rfidno = '${rfidno}' and id = '${travel_id}' `;
  //var inloc,outloc;
  let fare;
  connection.query(sql1, (err, [result]) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).send("Error executing MySQL query");
      return;
    }
    console.log(result);
    var inlat = result["in_lat"];
    var inlong = result["in_long"];
    inloc = inlat + "," + inlong;
    var outlat = result["in_lat"];
    var outlong = result["in_long"];
    outloc = outlat + "," + outlong;
    console.log(inloc);
    get_mapsjson(distance_calculation, rfidno, travel_id, inloc, outloc);

    get_mapsjson(fare_calculation, rfidno, travel_id, inloc, outloc);

    console.log(fare);
  });
});


function get_mapsjson(callback, rfidno, travel_id, inloc, outloc) {
  const mode = "driving";

  googleMapsClient.directions(
    {
      origin: inloc,
      destination: outloc,
      mode: mode,
    },
    (err, response) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log(response.json.routes[0].legs[0].distance);
      return callback(null, response.json.routes[0].legs[0], travel_id, rfidno);
    }
  );
}


function arrivaltime(error, jsonData, travel_id, rfidno) {
  if (error) throw error;
  var arrival_time = jsonData.duration.text;
  console.log(arrival_time);
}

function distance_calculation(error, jsonData, travel_id, rfidno) {
  if (error) throw error;
  var distance = jsonData.distance.value / 1000;
  console.log(distance);
  const sql = `UPDATE  user_travel SET  distance = '${distance}'  WHERE id = '${travel_id}' `;
  //let values = [1,data["rfidno"],data["bus_uniqueno"],data["inlat"],data["inlong"],data["inlat"],data["inlong"],1,0,"None", "dsf"];

  connection.query(sql, (err, result) => {
    if (err) {
      console.error("error", err);
      res.status(500).send("error executing MYSQL query");
      return;
    }
  });
}


function fare_calculation(error, jsonData, travel_id, rfidno) {
  if (error) throw error;
  const distance = jsonData.distance.value / 1000; // convert distance from meters to kilometers
  let fare = baseFare + distance * farePerKm;
  console.log(`The fare  is ${fare.toFixed(2)}`);

  const sql = `UPDATE  user_travel SET  amt_detect = '${fare}'  WHERE id = '${travel_id}' `;
  //let values = [1,data["rfidno"],data["bus_uniqueno"],data["inlat"],data["inlong"],data["inlat"],data["inlong"],1,0,"None", "dsf"];

  connection.query(sql, (err, result) => {
    if (err) {
      console.error("error", err);
      res.status(500).send("error executing MYSQL query");
      return;
    }
  });

  const apiUrl = "https://smart-bus-system-fyp.onrender.com/wallet/" + rfidno;

  // Make the GET request
  axios
    .get(apiUrl)
    .then((response) => {
      // Handle the response data
      console.log(response.data);

      var wallet_amt = response.data["wallet_amt"];
      var new_amt = wallet_amt - fare;

      const postData = {
        new_amt: new_amt,
      };
      if (wallet_amt > 50)
        axios
          .post("http://smart-bus-system-fyp.onrender.com/wallet_update/" + rfidno, postData)
          .then((response) => {
            console.log("Message sent successfully!");
          })
          .catch((error) => {
            console.error("Error sending message:", error);
          });
    })
    .catch((error) => {
      // Handle the error
      console.log(error);
    });
}

app.post("/wallet_update/:rfidno", (req, res) => {
  const rfidno = req.params.rfidno;
  const data = req.body;
  console.log(rfidno);
  const sql = `UPDATE  register SET  wallet_amt = '${data["new_amt"]}'  WHERE rfidno = '${rfidno}' `;
  //let values = [1,data["rfidno"],data["bus_uniqueno"],data["inlat"],data["inlong"],data["inlat"],data["inlong"],1,0,"None", "dsf"];

  connection.query(sql, (err, result) => {
    if (err) {
      console.error("error", err);
      res.status(500).send("error executing MYSQL query");
      return;
    }
    res.send(result);
  });
});

app.get("/wallet/:emailid", (req, res) => {
  const emailid = req.params.emailid;
  const sql = `SELECT wallet_amt FROM register WHERE email = '${emailid}' `;

  connection.query(sql, (err, [result]) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).send("Error executing MySQL query");
      return;
    }
    res.send(result);
  });
});

// Start the server
const port = 5000;
app.listen(process.env.PORT || port, () => {
  console.log(`Server is running on port ${port}`);
});
