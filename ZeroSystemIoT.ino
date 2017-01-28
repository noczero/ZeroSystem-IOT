#include <dht.h>
dht DHT;
int start = 0;
int humid = 0;
#define DHT11_PIN 2
#define MoisturePIN A0

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
                Serial.print("OK,"); 
                break;
    case DHTLIB_ERROR_CHECKSUM: 
                Serial.print("Checksum error,"); 
                break;
    case DHTLIB_ERROR_TIMEOUT: 
                Serial.print("Time out error,"); 
                break;
    default: 
                Serial.print("Unknown error,"); 
                break;
  }
  // DISPLAY DATA, Humidity -- Temperature
  Serial.print(DHT.humidity, 1);
  Serial.print(",");
  Serial.print(DHT.temperature, 1);
}

void moisture(int pinA0){
 humid = analogRead(pinA0);
  Serial.print(",");
  Serial.print(1023 - humid); 
}

void loop() {
  // put your main code here, to run repeatedly:
  if (Serial.available() > 0 ) {
    char command = (char)Serial.read();
      if (command == '1') {
        //Start
        start = 1;
      } else if (command == '0') {
        //Stopped
        start = 0;
        Serial.println("Zero System Stopped");
        Serial.println("===================");
     }
  }
  
  if (start == 1){
    temp_humid();
    moisture(MoisturePIN);
    Serial.println();
  }
  
  delay(2000);
  
}
