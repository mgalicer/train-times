#include <Adafruit_NeoPixel.h>

#include <SPI.h>
#include <WiFi101.h>

#define PIN 6

// Parameter 1 = number of pixels in strip
// Parameter 2 = pin number (most are valid)
// Parameter 3 = pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(24, PIN, NEO_GRB + NEO_KHZ800);
unsigned long lastConnectionTime = 0;            // last time you connected to the server, in milliseconds
const unsigned long postingInterval = 10L * 1000L; // delay between updates, in milliseconds   

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
  strip.begin();
  strip.show();
  
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


char ourBuf[200]; 
int counter = 0;
boolean toWrite = false;
void loop() {
  // if there are incoming bytes available
  // from the server, read them and print them:
  
  while (client.available()) {
    char c = client.read();
    if(c == '{') {
      toWrite = true;
    } 
    else if(c == '}') {
      ourBuf[counter] = '\0';
      toWrite = false;
    } 
    else if(toWrite) {
      ourBuf[counter] = c;
      counter += 1;
    }
    
  }

  if (millis() - lastConnectionTime > postingInterval) {
    Serial.println(ourBuf);
    httpRequest();
    counter = 0;
  }
}

void httpRequest() {
  // close any connection before send a new request.
  // This will free the socket on the WiFi shield
  client.stop();

  // if you get a connection, report back via serial:
  if (client.connect(server, 80)) {
//    Serial.println("connected to server");
    // Make a HTTP request:
    client.println("GET /mari-train-time HTTP/1.1");
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
