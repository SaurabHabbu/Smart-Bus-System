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

app.get("/user_history/:rfidno", async (req, res) => {
  
  const newjson = [];
  const rfidno = req.params.rfidno;
  const user_travel_history = query(
    collection(user_travel_col,rfidno,'travel'),
    where('tapOut','==',true)

  ); 
  const querysnapshot = await getDocs(user_travel_history);
  querysnapshot.forEach( (snap) => {
    newjson.push(snap.data());
  });
  res.send(newjson);
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


  const q = query(rfid_travel, where('tapOut', '==', 0));
  //console.log(q);
  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
     
      const matchingDoc = querySnapshot.docs[0];
      const matchingdocref = matchingDoc.ref;
      console.log(matchingdocref);
      //console.log(matchingDoc.get());
      updateDoc(matchingdocref,docdata);
      get_mapsjson(distance_fair_calculation, matchingdocref );

      //get_mapsjson(fare_calculation, matchingdocref );
      //console.log(docdata); 
      res.send(true);
    } else {
      
      res.send(false);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).send("Error fetching documents");
  }
  
 

});


async function get_mapsjson(callback, docreference) {
  const mode = "driving";
  const mysnapshot = await getDoc(docreference);

  if(mysnapshot.exists()){
    const docdata = mysnapshot.data();
    const inlat = docdata.inlat;
    const inlong = docdata.inlong;
    const outlat = docdata.outlat;
    const outlong = docdata.outlong;
    const rfidno = docdata.rfidno;

    const inloc = inlat + "," + inlong;
    const outloc = outlat + "," + outlong;



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
        return callback(null, response.json.routes[0].legs[0],rfidno,docreference);
      }
    );
  }
 
}


async function arrivaltime(error, jsonData, travel_id, rfidno) {
  if (error) throw error;
  var arrival_time = jsonData.duration.text;
  console.log(arrival_time);
}

function distance_fair_calculation(error, jsonData,rfidno,docreference) {
  if (error) throw error;
  var distance_inkm = jsonData.distance.value / 1000;
  console.log("hello",distance_inkm);
  let fare = baseFare + distance_inkm * farePerKm;
  console.log(`The fare  is ${fare.toFixed(2)}`);
 
  const docdata = {
    distance_travelled : distance_inkm,
    amt_deducted : fare
  };
  updateDoc(docreference,docdata);
  wallet_update(rfidno,fare);
  
}

async function wallet_update(rfidno,fare){

  const q = query(user_info, where('rfidno', '==', rfidno));

  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const wallet_amt = querySnapshot.docs[0].data().wallet_amt;
      const docreference = querySnapshot.docs[0].ref;
      console.log("wallet amt is ", wallet_amt);

      const new_wallet_amt = wallet_amt - fare;

      const docdata = {
        wallet_amt : new_wallet_amt
      };
      updateDoc(docreference,docdata);

    } 
  } catch (error) {
    console.error("Error fetching documents:", error);
  }

}


// Start the server
const port = 5000;
app.listen(process.env.PORT || port, () => {
  console.log(`Server is running on port ${port}`);
});
