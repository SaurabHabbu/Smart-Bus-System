#include <MFRC522.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>
#include <HttpClient.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include "ESP8266WiFi.h"
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

unsigned int bus_unique_id = ESP.getChipId();
String busid = String(bus_unique_id);

const char* ssid = "TP-Link_ACF9";
const char* password = "71330037";
#define SERVER_IP "smart-bus-system-fyp.onrender.com"

bool debounce = false;
unsigned long debounceTime = 1000; // Debounce time in milliseconds

#define SS_PIN D8  // RFID reader's SS pin
#define RST_PIN D3  // RFID reader's RST pin

 float Latitude , Longitude;
int year , month , date, hour , minute , second;
String DateString , TimeString , LatitudeString , LongitudeString;

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance
TinyGPSPlus gps;  // Create TinyGPS++ instance
unsigned long lastReadTime = 0;

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 10000; // 10 seconds


String latitude_string,longitude_string;

SoftwareSerial gpsSerial(2, 3);  // Define the pins used for GPS (RX, TX)

WiFiClientSecure client;

unsigned long lastTapTime = 0;
bool tapIn = false;

void setup() {

  Serial.begin(9600);
  gpsSerial.begin(9600);  // Initialize GPS serial communication
  SPI.begin();  // Initialize SPI communication for the RFID reader
  mfrc522.PCD_Init();  // Initialize RFID reader
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected!");
   client.setInsecure();
}

void loop() {
  // Read RFID tag if detected
  while (gpsSerial.available() > 0)
    if (gps.encode(gpsSerial.read()))
   
    {
      
      if (gps.location.isValid())
      {
        Latitude = gps.location.lat();

        LatitudeString = String(Latitude , 6);
        
        Longitude = gps.location.lng();
        LongitudeString = String(Longitude , 6);
      }

  rfid_op(LatitudeString,LongitudeString);
  // Get GPS data
  if (millis() - lastSendTime >= sendInterval) {
        Serial.println("sending bus location");
        bus_gps(LatitudeString,LongitudeString);
        lastSendTime = millis();
      }
    //latlong_gps();
}
}
void bus_gps(String latitude,String longitude){

  /* String latitude,longitude;
  latlong_gps(&latitude,&longitude); */
  Serial.println(latitude);
  //Serial.println(latitude);
  String updated;
  StaticJsonDocument<200> jsonDoc;
  jsonDoc["bus_uniqueno"] = busid;
  jsonDoc["lat"] = latitude;
  jsonDoc["long"] = longitude;

  String jsonStr;
  serializeJson(jsonDoc, jsonStr);
  String endpoint = "/bus_location_update";
  String data = "{\"bus_uniqueno\":"+ busid +",\"lat\":"+ latitude +",\"long\":"+ longitude +"}";
  updated = post_api(endpoint,jsonDoc);

}

void rfid_op(String latitude, String longitude){
  
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    unsigned long currentTime = millis();

    String tagUID = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      tagUID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      tagUID += String(mfrc522.uid.uidByte[i], HEX);
    }
    

    if (!tapIn && (currentTime - lastTapTime > 10000)) {
      // Tap-in event
      Serial.println("Tap-in");
      String rfid_present ;
      String endpoint = "/";
      rfid_present = get_api(endpoint,tagUID);
      tapIn = true;
      if(rfid_present == "true"){
      
      endpoint = "/wallet/";
      //String wallet_amt_string = get_api(endpoint,tagUID);
      //float wallet_amt = atof(wallet_amt_string.c_str());
      if(tapIn){
         
          endpoint = "/user_travel_init";
         /*  String latitude_string,longitude_string;
          latlong_gps(&latitude_string,&longitude_string); */
          String updated;
          Serial.println(latitude);
          StaticJsonDocument<200> jsonDoc;
          jsonDoc["rfidno"] = tagUID;
          jsonDoc["bus_uniqueno"] = busid;
          jsonDoc["inlat"] = latitude;
          jsonDoc["inlong"] = longitude;

          String jsonStr;
          serializeJson(jsonDoc, jsonStr);

          //String data = "{\"rfidno\":"+ tagUID +",\"bus_uniqueno\":"+ busid +",\"inlat\":"+ latitude +",\"inlong\":"+ longitude +"}";
          //Serial.println(jsonStr);
          updated = post_api(endpoint,jsonStr);
          
          
      }
    
    }
      lastTapTime = currentTime;
    } else if (tapIn && (currentTime - lastTapTime > 10000)) {
      // Tap-out event
      Serial.println("Tap-out");
      tapIn = false;
      String rfid_present ;
      String endpoint = "/";
      rfid_present = get_api(endpoint,tagUID);
      if(rfid_present == "true"){
          String endpoint1 = "/tapout/";
          String travel_id = get_api(endpoint1,tagUID);
          DynamicJsonDocument doc(1024); // Allocate a JSON document with enough space
          deserializeJson(doc, travel_id);
          String idno = doc["id"];
          Serial.println(idno);
          endpoint = "/user_tapout";
          /* String latitude,longitude;
          latlong_gps(&latitude,&longitude); */
          String updated;
          StaticJsonDocument<200> jsonDoc;
          jsonDoc["travel_id"] = idno;
          jsonDoc["rfidno"] = tagUID;
          jsonDoc["bus_uniqueno"] = busid;
          jsonDoc["outlat"] = latitude;
          jsonDoc["outlong"] = longitude;

          String jsonStr;
          serializeJson(jsonDoc, jsonStr);

          
          updated = post_api(endpoint,jsonStr);

        
      }
      lastTapTime = currentTime;
    } else {
      // Ignore this tap
      Serial.println("Tap ignored");
      return ;
    }
    
    
    
  }
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}


String get_api(String endpoint,String tagUID){

 
  String apiUrl = SERVER_IP+endpoint+tagUID;
  Serial.println(apiUrl);
 if (!client.connect(SERVER_IP, 443))
  {
    Serial.println(F("Connection failed"));
    return "";
  }

  // give the esp a breather
  yield();

  // Send HTTP request
  client.print(F("GET "));
  // This is the second half of a request (everything that comes after the base URL)
  client.print(endpoint+tagUID); // %2C == ,

  // HTTP 1.0 is ideal as the response wont be chunked
  // But some API will return 1.1 regardless, so we need
  // to handle both.
  client.println(F(" HTTP/1.0"));

  //Headers
  client.print(F("Host: "));
  client.println(SERVER_IP);

  client.println(F("Cache-Control: no-cache"));

  if (client.println() == 0)
  {
    Serial.println(F("Failed to send request"));
    return "";
  }
  //delay(100);
  // Check HTTP status
  char status[32] = {0};
  client.readBytesUntil('\r', status, sizeof(status));

  // Skip HTTP headers
  char endOfHeaders[] = "\r\n\r\n";
  if (!client.find(endOfHeaders))
  {
    Serial.println(F("Invalid response"));
    return "";
  }

  String str1 = "";
  while (client.available() && client.peek() != '{' && client.peek() != '[')
  {
    char c = 0;
    client.readBytes(&c, 1);
    str1 += String(c); 
    Serial.print(str1);
    
  }
  
  // While the client is still availble read each
  // byte and print to the serial monitor
  while (client.available())
  {
    char c = 0;
    client.readBytes(&c, 1);
    str1 += String(c); 
    Serial.print(str1);
  }
  return str1;
}

String post_api(String endpoint,StaticJsonDocument data){
  
  if ((WiFi.status() == WL_CONNECTED)) {
   //data = "{\"bus_uniqueno\":\"1238\",\"lat\":\"34234\",\"long\":\"34234\"}";
    int dataLength = 250;

 if (!client.connect(SERVER_IP, 443))
  {
    Serial.println(F("Connection failed"));
    return "";
  }

  // give the esp a breather
  yield();
    
  client.println("POST /bus_location_update HTTP/1.1");
  client.print("Host: ");
  client.println(SERVER_IP);
  client.println("Content-Type: application/json"); // Add a line ending after the value
  client.print("Content-Length: ");
  client.println(dataLength);
  client.println(); // Add a blank line after the headers
  client.print(data);

  //Headers

  client.println(F("Cache-Control: no-cache"));

  if (client.println() == 0)
  {
    Serial.println(F("Failed to send request"));
    return "";
  }
  //delay(100);
  // Check HTTP status
  char status[32] = {0};
  client.readBytesUntil('\r', status, sizeof(status));

  // Skip HTTP headers
  char endOfHeaders[] = "\r\n\r\n";
  if (!client.find(endOfHeaders))
  {
    Serial.println(F("Invalid response"));
    return "";
  }

  // For APIs that respond with HTTP/1.1 we need to remove
  // the chunked data length values at the start of the body
  //
  // peek() will look at the character, but not take it off the queue
  String str1 ="";
  while (client.available() && client.peek() != '{' && client.peek() != '[')
  {
    char c = 0;
    client.readBytes(&c, 1);
     str1 = str1 + String(c); 
    Serial.print(str1);
    
  }

  // While the client is still availble read each
  // byte and print to the serial monitor
  while (client.available())
  {
    char c = 0;
    str1 = str1 + String(c); 
    Serial.print(str1);
  }
  return "true";

}
  return "eror";

}

/* void latlong_gps(String* latitude_string,String* longitude_string){
   while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      //Serial.print("Location: ");
      //Serial.print(gps.location.lat(), 6);
      //Serial.print(", ");
      //Serial.println(gps.location.lng(), 6);
    

      *latitude_string = String(gps.location.lat(),6);
      *longitude_string = String(gps.location.lng(),6);

      
      
      //Serial.println(updated);
      
    }
  }
}

 */