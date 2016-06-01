#include <SocketIOClient.h>
#include <Ethernet.h>

byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
char server[] = "192.168.0.156";
int port = 3000;
SocketIOClient client;

void setup() {
  Serial.begin(9600);
  Ethernet.begin(mac);
  Serial.println(Ethernet.localIP());
  if(!client.connect(server, port)) Serial.print("Error connecting to server.");
  
  client.setDataArrivedDelegate(dataArrived);
  client.send("Hello World!");
}

void loop() {
  client.monitor();
}

void dataArrived(SocketIOClient client, char *data) {
  Serial.println(data);
}
