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
const { getFirestore,collection,getDoc,getDocs,query, where,doc,setDoc,updateDoc, addDoc } =require("firebase/firestore");

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
const user_travel_col = collection(firebase_db,"user_travel");

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
app.get("/user_fetch/:emailid", async (req, res) => {
  const emailid = req.params.emailid;
  const q = query(user_info, where('email', '==', emailid));
  //var wallet_amt = [];
  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
     
      const matchingDoc = querySnapshot.docs[0].data();
      
      res.send(matchingDoc);

      
    } else {
      
      res.send(false);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).send("Error fetching documents");
  }
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

app.get("/wallet/:rfidno",async (req, res) => {
  const rfidno = req.params.rfidno;
  const q = query(user_info, where('rfidno', '==', rfidno));
  var wallet_amt = [];
  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
     
      const matchingDoc = querySnapshot.docs[0].data();
      var wallet_amt = matchingDoc.wallet_amt;
      res.send({"wallet_amt": matchingDoc.wallet_amt});
      
      
    } else {
      
      res.send(false);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).send("Error fetching documents");
  }

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


app.get("/amt_present/:rfidno", async (req,res) => {
  const rfidno = req.params.rfidno;
  const q = query(user_info, where('rfidno', '==', rfidno));
  var wallet_amt = [];
  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
     
      const matchingDoc = querySnapshot.docs[0].data();
      var wallet_amt = matchingDoc.wallet_amt;
      //res.send({"wallet_amt": matchingDoc.wallet_amt});
      //var wallet_amt = result["wallet_amt"];
      if(wallet_amt < 50){
        res.send("No Entry!Recharge");
      }
      else{
        res.send("Enter!");
      }
   
      
    } else {
      
      res.send(false);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).send("Error fetching documents");
  }

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
  
  
});

app.post("/bus_location_update", async (req, res) => {
  
  const data = req.body;
  const id = doc(firebase_db,'bus_info/'+data["bus_uniqueno"]+'');
 
  const docdata = {
    lat : data["lat"],
    long : data["long"],

  };

  updateDoc(id,docdata); 
  res.send(true);

});

app.post("/user_travel_init", async (req, res) => {
  const data = req.body;
  console.log(data);
  var datetime = dateandtime();
  const rfidno = data["rfidno"];
  const rfid_travel = collection(user_travel_col,rfidno,'/travel');
  //const rfid_final = collection('travel');

  const newdoc = await addDoc(rfid_travel,data);
  res.send(newdoc.path);
});

app.post("/user_loc",(req,res) =>  {
  const data = req.body;
  console.log(data);
});

app.get("/wallet_email/:emailid", async (req, res) => {
  const emailid = req.params.emailid;
  const q = query(user_info, where('rfidno', '==', rfidno));
  var wallet_amt = [];
  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
     
      const matchingDoc = querySnapshot.docs[0].data();
      var wallet_amt = matchingDoc.wallet_amt;
      res.send({"wallet_amt": matchingDoc.wallet_amt});
      
      
    } else {
      
      res.send(false);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).send("Error fetching documents");
  }

});

/* app.post("/wallet_update/:rfidno", (req, res) => {
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
}); */

app.post("/user_tapout", async (req, res) => {
  const data = req.body;
  var rfidno = data["rfidno"];
  var travel_id = data["travel_id"];
  console.log(data);
  var datetime = dateandtime();
  const rfid_travel = collection(user_travel_col,rfidno,'/travel');
  //const rfid_travel = doc(firebase_db,'bus_travel/'+data["bus_uniqueno"]);
  //String data = "{\"rfidno\":\""+ tagUID +"\",\"bus_uniqueno\":\""+ busid +"\",\"inlat\":"+ latitude +",\"inlong\":"+ longitude +",\"tapOut\":"+ false +"}";
  console.log(rfid_travel);
  const docdata = {
    rfidno : data["rfidno"],
    bus_uniqueno : data["bus_uniqueno"],
    outlat : data["outlat"],
    outlong : data["outlong"],
    tapOut : data["tapOut"]

  };

 /*  const snapshot = await user_info.where('rfidno', '==', rfidno).get();
  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }  

  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  }); */
  const q = query(rfid_travel, where('tapOut', '==', false));
  console.log(q);
  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
     
      const matchingDoc = querySnapshot.docs[0];
      const matchingdocref = matchingDoc.ref;
      //console.log(matchingDoc.get());
      updateDoc(matchingdocref,docdata); 
      res.send(true);
    } else {
      
      res.send(false);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).send("Error fetching documents");
  }
  
 
  //res.send(true);

  //res.send(true);
 /*  console.log(result);
  var inlat = result["in_lat"];
  var inlong = result["in_long"];
  inloc = inlat + "," + inlong;
  var outlat = result["in_lat"];
  var outlong = result["in_long"];
  outloc = outlat + "," + outlong;
  console.log(inloc);
  get_mapsjson(distance_calculation, rfidno, travel_id, inloc, outloc);

  get_mapsjson(fare_calculation, rfidno, travel_id, inloc, outloc);

  console.log(fare); */

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

// Start the server
const port = 5000;
app.listen(process.env.PORT || port, () => {
  console.log(`Server is running on port ${port}`);
});
