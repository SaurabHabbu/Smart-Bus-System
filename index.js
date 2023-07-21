const express = require("express");
const distance = require("googlemaps/lib/distance");
const mysql = require("mysql");
//const firebase_db = require("./configdb");
const googleMapsClient = require("@google/maps").createClient({
  key: "AIzaSyBXimlauknGEyl2PSJeTTh8ykMZVUNUn8E",
});
const axios = require("axios");

const baseFare = 2.5;
const farePerKm = 2.0;
const peakHourSurcharge = 1.0;

const app = express();
const { initializeApp } = require("firebase/app");
const { getFirestore,collection,getDoc,getDocs,query, where } =require("firebase/firestore");
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = initializeApp({
  apiKey: "AIzaSyBBVKrAAKNfzV49CDztR5EggpWo_e9XziE",
  authDomain: "finalyearproject-1e06f.firebaseapp.com",
  projectId: "finalyearproject-1e06f",
  storageBucket: "finalyearproject-1e06f.appspot.com",
  messagingSenderId: "509940526774",
  appId: "1:509940526774:web:2420d6c1539165e4834017",
  measurementId: "G-TZ1TDZ5Z4D"
});

// Initialize Firebase
//const app = initializeApp(firebaseConfig);
const firebase_db =  getFirestore(firebaseConfig);

const bus_info_col = collection(firebase_db,"bus_info");
const user_info = collection(firebase_db,"user_info");
//const bus_info_col = collection(firebase_db,"bus_info");
//const analytics = getAnalytics(app);
app.use(express.json());
// MySQL database configuration


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


// API route to get a specific parameter
app.get("/user_fetch/:emailid", (req, res) => {
  const emailid = req.params.emailid;
  
});

app.get("/bus_fetch",async (req, res) => {
    var newJson = [];
    const orderquery = query( bus_info_col);
    const snapshot = await getDocs(orderquery);
    snapshot.forEach((snap) => {
      newJson.push(snap.data());
    });
    res.send(newJson);
    //const docdata = alldocs.data();
    //res.send(docdata);

  });

app.get("/wallet/:rfidno",(req, res) => {
  const rfidno = req.params.rfidno;
  const sql = `SELECT wallet_amt FROM register WHERE rfidno = '${rfidno}'`;
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


app.get("/amt_present/:rfidno", (req,res) => {
  const rfidno = req.params.rfidno;
  const sql = `SELECT wallet_amt FROM register WHERE rfidno = '${rfidno}' `;

  connection.query(sql, (err, [result]) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).send("Error executing MySQL query");
      return;
    }
    var wallet_amt = result["wallet_amt"];
    if(wallet_amt < 50){
      res.send("No Entry!Recharge");
    }
    else{
      res.send("Enter!");
    }
  });

});

app.get("/rfid_present/:rfidno", async (req, res) => {
  const rfidno = req.params.rfidno;
  

  // Create a query to find documents where 'rfid' field is equal to 'rfidno'
  const q = query(user_info, where('rfidno', '==', rfidno));

  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
     
      const matchingDoc = querySnapshot.docs[0].data();
      res.send(true);
    } else {
      
      res.send(false);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).send("Error fetching documents");
  }
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

app.post("/user_loc",(req,res) =>  {
  const data = req.body;
  console.log(data);
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
  const distance = jsonData.distance.value/1000 ; // convert distance from meters to kilometers
  let fare = baseFare + distance * farePerKm;
  console.log(`The fare  is ${fare.toFixed(2)}`);

  const sql = `UPDATE  user_travel SET  amt_deduct = '${fare}'  WHERE id = '${travel_id}' `;
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
          .post("https://smart-bus-system-fyp.onrender.com/wallet_update/" + rfidno, postData)
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

app.get("/wallet_email/:emailid", (req, res) => {
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
