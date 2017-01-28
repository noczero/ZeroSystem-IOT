#include <dht.h>
dht DHT;
int start = 0;
#define DHT11_PIN 2

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  Serial.println("Zero System");
  Serial.println("===========");
  Serial.println("Arduino Smart Home");
}

void temp_humid(){
  int chk = DHT.read11(DHT11_PIN);
  switch (chk)
  {
    case DHTLIB_OK:  
                Serial.print("OK,\t"); 
                break;
    case DHTLIB_ERROR_CHECKSUM: 
                Serial.print("Checksum error,\t"); 
                break;
    case DHTLIB_ERROR_TIMEOUT: 
                Serial.print("Time out error,\t"); 
                break;
    default: 
                Serial.print("Unknown error,\t"); 
                break;
  }
  // DISPLAY DATA, Humidity -- Temperature
  Serial.print(DHT.humidity, 1);
  Serial.print(" , ");
  Serial.println(DHT.temperature, 1);
}

void loop() {
  // put your main code here, to run repeatedly:
  if (Serial.available() > 0 ) {
    int command = Serial.parseInt();
      if (command == 1) {
        //Start
        start = 1;
      } else if (command == 0) {
        //Stopped
        start = 0;
        Serial.println("Zero System Stopped");
        Serial.println("===================");
     }
  }
  
  if (start == 1){
    temp_humid();
  }
  
  delay(2000);
  
}
