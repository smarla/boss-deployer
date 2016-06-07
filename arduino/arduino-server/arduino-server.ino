#include <SPI.h>
#include <Ethernet.h>

// Server (Raspy) information
char apiUrl[] = "http://192.168.1.35";
char apiHost[] = "Host: 192.168.1.35";
char apiPort = 5000;


// Our mac address
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };

// Our private IP
//IPAddress ip(192, 168, 0, 250);

// Inner stuff
String readString;
String http_lock = "GET /lock HTTP/1.1";
String http_unlock = "GET /unlock HTTP/1.1";
String http_release = "GET /release HTTP/1.1";
String http_block = "GET /block HTTP/1.1";
String http_default = "GET /default HTTP/1.1";
int currentR = 0;
int currentG = 0;
int currentB = 0;

bool locked = false;
bool released = false;
bool blocked = false;

EthernetServer server(80);
EthernetClient apiClient;

int red = 6;
int green = 5;
int blue = 3;

int led1 = A0;
int led2 = A3;
int led3 = A1;
int led4 = A2;
int led5 = A4;

int unlockButton = 7;
int blockButton = 8;
int releaseButton = 9;


void setup() {
  // Start serial communication, 9600 Bauds
  Serial.begin(9600);

  // RGB Leds
  pinMode(red, OUTPUT);
  pinMode(green, OUTPUT);
  pinMode(blue, OUTPUT);

  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(led3, OUTPUT);
  pinMode(led4, OUTPUT);
  pinMode(led5, OUTPUT);

  pinMode(unlockButton, INPUT);
  pinMode(blockButton, INPUT);
  pinMode(releaseButton, INPUT);

  rgb(20, 0, 0);
  lightSequence(2000);
  lightsOn();

//  setupServer();

//  reachServer();
}

void loop() {
  //  runServer();

  readState();
  
  // States
  if(locked) lock();
  if(released) release();
  if(blocked) block();
}

void setupServer() {
  Serial.println("--------------------------------");
  Serial.println("| Boss deployer arduino Server |");
  Serial.println("--------------------------------");

  Serial.println("Configuring networking...");
  Ethernet.begin(mac);

  Serial.println("Starting web server...");
  server.begin();

  Serial.print("Server up. Listening to requests at ");
  Serial.print(Ethernet.localIP());
  Serial.println(":80\n");
}

void runServer() {
  EthernetClient client = server.available();
  if(client) {
    while(client.connected()) {
      if(client.available()) {
        char c = client.read();
    
        //if HTTP request has ended
        if (c == '\n') {
    
          ///////////////
          Serial.println(readString);

          // Answer
          client.println("HTTP/1.1 200 OK");
          client.println("Content-Type: application/json");
          client.println("Connection: close");  // the connection will be closed after completion of the response
          client.println();
          client.print("{ \"operation\": ");
          if(readString == http_release) {
            client.println("\"unlock\"");
            released = true;
          }
          else if(readString == http_block) {
            client.println("\"block\"");
            blocked = true;
          }
          else if(readString == http_default) {
            client.println("\"default\"");
            blocked = false;
            released = false;
          }
          else if(readString == http_lock) {
            client.println("\"lock\"");
            locked = true;
          }
          else if(readString == http_unlock) {
            client.println("\"unlock\"");
            locked = false;
          }
          client.println(" }");
          
          readString = "";
      
          client.stop();
        } else if (c != '\r') {
          readString += c;
        }
      }
    }
  }
}

void readState() {
  // Buttons
  int unlockStatus = digitalRead(unlockButton);
  int blockStatus = digitalRead(blockButton);
  int releaseStatus = digitalRead(releaseButton);

  Serial.println(releaseStatus);

  // Button
  bool changed = false;
  if(unlockStatus == HIGH) {
    locked = false;
    released = false;
    blocked = false;

    delay(250);
  }
  if(blockStatus == HIGH) {
    blocked = true;
    released = false;
  }
  if(releaseStatus == HIGH) {
    released = true;
    blocked = false;
  }
}

/*
 * System operations
 */

void reachServer() {
  bool found = false;
  while(!found) {    
    fadeIn(80, 80, 80, 15);
    delay(500);
    fadeOut(5);

    Serial.println("Pinging API");
    found = callApi("GET /ping HTTP/1.1");    
  }

  
  fadeIn(0, 50, 0, 50);
  delay(500);
  fadeOut(10);

  Serial.println("/ -----------------------------\\");
  Serial.println("| Connection to API: Successful |");
  Serial.println("\\ ---------------------------- /");
}

void lock() {
  rgb(0, 0, 200);
  lightsOn();
  lightSequence(100);
  
  readState();
  delay(50);
  readState();
  
  rgb(0, 0, 200);
  lightsOn();
  lightSequenceInverse(100);
  delay(50);
}

void release() {
  fadeIn(0, 60, 0, 5);
  delay(10);
  fadeOut(20);
  delay(250);
}

void block() {
  rgb(60, 0, 0);
  lightSequence(100);
}

bool callApi(char query[]) {
  Serial.print(" > Calling api ");
  Serial.print(query);
  Serial.println();
  char *response;
  if (apiClient.connect(apiUrl, apiPort)) {
    char c = apiClient.read();
    Serial.print(c);
  
    apiClient.print(query);
    apiClient.println(apiHost);
    apiClient.println("Connection: close");
    apiClient.println();
    
    return true;
  }
  
  Serial.println(" > Error connecting to API");
  rgb(50, 0, 0);
  lightsOn();
  delay(500);
  return false;
}


/*
 * Light management stuff
 */

void lightsOff() {
  digitalWrite(led1, HIGH);
  digitalWrite(led2, HIGH);
  digitalWrite(led3, HIGH);
  digitalWrite(led4, HIGH);
  digitalWrite(led5, HIGH);
}

void lightsOn() {
  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);
  digitalWrite(led3, LOW);
  digitalWrite(led4, LOW);
  digitalWrite(led5, LOW);
}

void lightSequence(int ms) {
  lightsOff();
  
  digitalWrite(led1, LOW);
  delay(ms);
  
  digitalWrite(led1, HIGH);
  digitalWrite(led2, LOW);
  delay(ms);
  
  digitalWrite(led2, HIGH);
  digitalWrite(led3, LOW);
  delay(ms);

  digitalWrite(led3, HIGH);
  digitalWrite(led4, LOW);
  delay(ms);
  
  digitalWrite(led4, HIGH);
  digitalWrite(led5, LOW);
  delay(ms);

  digitalWrite(led5, HIGH);
}

void lightSequenceInverse(int ms) {
  lightsOff();

  digitalWrite(led5, LOW);
  delay(ms);

  digitalWrite(led5, HIGH);
  digitalWrite(led4, LOW);
  delay(ms);
  
  digitalWrite(led4, HIGH);
  digitalWrite(led3, LOW);
  delay(ms);
  
  digitalWrite(led3, HIGH);
  digitalWrite(led2, LOW);
  delay(ms);

  digitalWrite(led2, HIGH);
  digitalWrite(led1, LOW);
  delay(ms);
  digitalWrite(led1, HIGH);
}

void rgb(int r, int g, int b) {
  currentR = r;
  currentG = g;
  currentB = b;
  
  analogWrite(red, r);
  analogWrite(green, g);
  analogWrite(blue, b);
}

void fadeIn(int r, int g, int b, int ms) {
  int ir = 0, ig = 0, ib = 0;
  lightsOn();
  rgb(ir, ig, ib);
  while(ir <= r && ig <= g && ib <= b) {
    if(ir < r) ir++;
    if(ig < g) ig++;
    if(ib < b) ib++;
    
    rgb(ir, ig, ib);
    delay(ms);
    
    if(ir == r && ig == g && ib == b) break;
  }
}

void fadeOut(int ms) {
  int ir = currentR, ig = currentG, ib = currentB;
  while(ir >= 0 && ig >= 0 && ib >= 0) {
    if(ir > 0) ir--;
    if(ig > 0) ig--;
    if(ib > 0) ib--;
    
    rgb(ir, ig, ib);
    delay(ms);
    
    if(ir == 0 && ig == 0 && ib == 0) break;
  }

  lightsOff();
}

