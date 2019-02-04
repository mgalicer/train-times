#include <SPI.h>
#include <WiFi101.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_GFX.h>
#include <Adafruit_NeoMatrix.h>
#define PIN 6

// Parameter 1 = number of pixels in pixels
// Parameter 2 = pin number (most are valid)
// Parameter 3 = pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)
Adafruit_NeoPixel pixels = Adafruit_NeoPixel(64, PIN, NEO_GRB + NEO_KHZ800);
unsigned long lastConnectionTime = 0;            // last time you connected to the server, in milliseconds
const unsigned long postingInterval = 10000L; // delay between updates, in milliseconds   

#include "secrets.h" 
///////please enter your sensitive data in the Secret tab/arduino_secrets.h
char ssid[] = WIFI_KEY;        // your network SSID (name)
char pass[] = WIFI_PASS;    // your network password (use for WPA, or use as key for WEP)
int keyIndex = 0;            // your network key Index number (needed only for WEP)

int status = WL_IDLE_STATUS;

// Initialize the WiFi client library
WiFiClient client;

// server address:
char server[] = "train-times-mta.herokuapp.com";

void setup() {
  //Initialize Neopixels
  pixels.begin();
  pixels.setBrightness(2);
  pixels.show();
  
  //Initialize serial and wait for port to open:
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  // check for the presence of the shield:
  if (WiFi.status() == WL_NO_SHIELD) {
    Serial.println("WiFi shield not present");
    // don't continue:
    while (true);
  }

  // attempt to connect to WiFi network:
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);

    // wait 10 seconds for connection:
    delay(10000);
  }
  Serial.println("Connected to wifi");

  Serial.println("\nStarting connection to server...");

}

//this string will store our response from the API
String nextTrainString = "";
//flag keeps track of if we're receiving input from the API
boolean toWrite = false;
void loop() {
  
  while (client.available()) {
    char c = client.read();
    if(c == '[') {
      toWrite = true;
    } 
    else if(c == ',') {
      toWrite = false;
    } 
    else if(toWrite) {
      nextTrainString += c;
    }
    
  }

  if (millis() - lastConnectionTime > postingInterval) {
    // print train time to the Serial Monitor    
    Serial.println(nextTrainString);
    displayTrainTime(nextTrainString.toInt());
    // reset string    
    nextTrainString = "";

    httpRequest();
  }


}

void displayTrainTime(int nextTime) {
  pixels.clear();
  if(nextTime < 10) {
    setPixels(nextTime, 2);
  } else {
    int onesDigit = nextTime % 10;
    int tensDigit = nextTime / 10;
    setPixels(onesDigit, 4);
    setPixels(tensDigit, 0);
  }

}

void setPixels(int ledNum, int offset) {
  //the numbers, represented as their respective LED indices  
  int numbers[10][13] = {
    {9,10,16,19,24,27,32,35,41,42,-1,-1,-1}, //0
    {9,16,17,25,33,40,41,42,-1,-1,-1,-1,-1}, //1
    {9,10,16,19,26,33,40,41,42,43,-1,-1,-1}, //2
    {8,9,10,19,26,35,40,41,42,-1,-1,-1,-1}, //3
    {8,11,16,19,25,26,27,35,43,-1,-1,-1,-1}, //4
    {8,9,10,11,16,24,25,26,27,35,40,41,42}, //5
    {9,10,16,24,25,26,32,35,41,42,-1,-1,-1}, //6
    {8,9,10,11,19,26,33,41,-1,-1,-1,-1,-1}, //7
    {9,10,16,19,25,26,32,35,41,42,-1,-1,-1}, //8
    {9,10,16,19,25,26,27,35,41,42,-1,-1,-1} //9
  };
  
  for(int k=0; k<13; k++) {
    if(numbers[ledNum][k] >= 0) {
      pixels.setPixelColor(numbers[ledNum][k] + offset, pixels.Color(100,100,100));
      pixels.show(); // This sends the updated pixel color to the hardware.
    }
  }
}

void httpRequest() {
  // close any connection before send a new request.
  // This will free the socket on the WiFi shield
  client.stop();

  // if you get a connection, report back via serial:
  if (client.connect(server, 80)) {
    // Make a HTTP request:
    client.println("GET /next-train-times/C/A44/N HTTP/1.1");
    client.println("Host: train-times-mta.herokuapp.com");
    client.println("Connection: close");
    client.println();

    // note the time that the connection was made:
    lastConnectionTime = millis();
  }
  else {
    // if you couldn't make a connection:
    Serial.println("connection failed");
  }
}
