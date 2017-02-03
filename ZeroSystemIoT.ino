#include <SPI.h>
#include <MFRC522.h>
#include <dht.h>
dht DHT;
int start = 0;
int humid = 0;
#define DHT11_PIN 2
#define MoisturePIN A0
#define accX A1
#define accY A2
#define accZ A3
#define MQ2 A4
#define Pir 3
#define LED 4
#define SS_PIN 10
#define RST_PIN 9
MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance.

void pinInputOutput() {
  pinMode(DHT11_PIN, INPUT);
  pinMode(accX, INPUT);
  pinMode(accY, INPUT);
  pinMode(accZ, INPUT);
  pinMode(MoisturePIN, INPUT);
  pinMode(MQ2, INPUT);
  pinMode(Pir, INPUT);
  pinMode(LED, OUTPUT);
}


void setup() {
  // put your setup code here, to run once:
  pinInputOutput();
  Serial.begin(115200);
  Serial.println("Zero System");
  Serial.println("===========");
  Serial.println("List : ");
  Serial.println("Head,Humid,Temp,Mois,AccX,AccY,AccZ,MQ,Pir");
  SPI.begin();      // Init SPI bus
  mfrc522.PCD_Init(); // Init MFRC522 card
  Serial.println("Scan PICC to see UID and type...");
}

void turnOnLED(int x){
  digitalWrite(x , HIGH);

}

void turnOffLED(int x) {
  digitalWrite(x , LOW);
}

void rfid(){
  // Look for new cards
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Dump debug info about the card. PICC_HaltA() is automatically called.
  mfrc522.PICC_DumpToSerial(&(mfrc522.uid));  
}

int sensorThresSmoke = 400; //greater contaminate

void smoke(int MQ2){
  int smokeSensor = analogRead(MQ2);
  Serial.print(",");Serial.print(smokeSensor);
}

void motionSense(int x){
  int moves = digitalRead(x);
  Serial.print(",");Serial.print(moves);
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

int rawX = 0 , rawY = 0 , rawZ = 0;
int scale = 200; //for aXDL377 if ADXL337 : 3;
boolean micro_is_5V = true;
 
void accelerometer(int pinA1 , int pinA2 , int pinA3){
   rawX = analogRead(A1);
   rawY = analogRead(A2);
   rawZ = analogRead(A3);
   
    float scaledX, scaledY, scaledZ; // Scaled values for each axis
    if (micro_is_5V) // microcontroller runs off 5V Arduino
    {
      scaledX = mapf(rawX, 0, 675, -scale, scale); // 3.3/5 * 1023 =~ 675
       scaledY = mapf(rawY, 0, 675, -scale, scale);
        scaledZ = mapf(rawZ, 0, 675, -scale, scale);
    }
    else // microcontroller runs off 3.3V others
    {
      scaledX = map(rawX, 0, 1023, -scale, scale);
      scaledY = map(rawX, 0, 1023, -scale, scale);
      scaledZ = map(rawX, 0, 1023, -scale, scale);
    }
    
  Serial.print(",");Serial.print(scaledX);
  Serial.print(",");Serial.print(scaledY);
  Serial.print(",");Serial.print(scaledZ);
}


void loop() {
  // put your main code here, to run repeatedly:
    //rfid();
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
     } else if (command == '2'){
      turnOnLED(LED);
      Serial.println("LED ON");
     } else if (command == '3'){
      turnOffLED(LED);
      Serial.println("LED OFF");
     }
  }
  
  if (start == 1){
    temp_humid();
    moisture(MoisturePIN);
    accelerometer(accX,accY,accZ);
    smoke(MQ2);
    motionSense(Pir);
    Serial.println();
  }


  delay(1000);
  
}

// Same functionality as Arduino's standard map function, except using floats
float mapf(float x, float in_min, float in_max, float out_min, float out_max)
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
