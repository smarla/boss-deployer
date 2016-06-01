#include <SPI.h>
#include <Ethernet.h>

// Our mac address
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };

// Our private IP
IPAddress ip(192, 168, 0, 254);

// Inner stuff
String readString;
String http_ui = "GET /ui HTTP/1.1";
String http_lock = "GET /lock HTTP/1.1";
String http_free = "GET /free HTTP/1.1";
bool lockOpened = false;

EthernetServer server(80);

void setup() {
  // Start serial communication, 9600 Bauds
  Serial.begin(9600);

  pinMode(6, OUTPUT);
  pinMode(7, OUTPUT);
  digitalWrite(6, HIGH);
  digitalWrite(7, HIGH);
  
  setupServer();
}

void loop() {
  runServer();
  if(lockOpened) openLock();
}

void setupServer() {
  Serial.println("--------------------------------");
  Serial.println("| Boss deployer arduino Server |");
  Serial.println("--------------------------------");

  Serial.println("Configuring networking...");
  Ethernet.begin(mac, ip);

  Serial.println("Starting web server...");
  server.begin();

  Serial.print("Server up. Listening to requests at ");
  Serial.print(Ethernet.localIP());
  Serial.println(":80\n");

  // TODO connect to raspy service
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
          if(readString == http_ui) {
            client.println("\"ui\"");
          }
          else if(readString == http_lock) {
            client.println("\"lock\"");
            lockOpened = true;
          }
          else if(readString == http_free) {
            client.println("\"free\"");
            lockOpened = false;
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

void openLock() {
  digitalWrite(7, LOW);
  delay(1000);
  digitalWrite(7, HIGH);
  delay(1000);
}

