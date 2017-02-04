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

#define         RL_VALUE                     (5)     //define the load resistance on the board, in kilo ohms
#define         RO_CLEAN_AIR_FACTOR          (9.83)  //RO_CLEAR_AIR_FACTOR=(Sensor resistance in clean air)/RO,
                                                     //which is derived from the chart in datasheet
 
/***********************Software Related Macros************************************/
#define         CALIBARAION_SAMPLE_TIMES     (50)    //define how many samples you are going to take in the calibration phase
#define         CALIBRATION_SAMPLE_INTERVAL  (500)   //define the time interal(in milisecond) between each samples in the
                                                     //cablibration phase
#define         READ_SAMPLE_INTERVAL         (50)    //define how many samples you are going to take in normal operation
#define         READ_SAMPLE_TIMES            (5)     //define the time interal(in milisecond) between each samples in 
                                                     //normal operation
 
/**********************Application Related Macros**********************************/
#define         GAS_LPG                      (0)
#define         GAS_CO                       (1)
#define         GAS_SMOKE                    (2)
 
/*****************************Globals***********************************************/
float           LPGCurve[3]  =  {2.3,0.21,-0.47};   //two points are taken from the curve. 
                                                    //with these two points, a line is formed which is "approximately equivalent"
                                                    //to the original curve. 
                                                    //data format:{ x, y, slope}; point1: (lg200, 0.21), point2: (lg10000, -0.59) 
float           COCurve[3]  =  {2.3,0.72,-0.34};    //two points are taken from the curve. 
                                                    //with these two points, a line is formed which is "approximately equivalent" 
                                                    //to the original curve.
                                                    //data format:{ x, y, slope}; point1: (lg200, 0.72), point2: (lg10000,  0.15) 
float           SmokeCurve[3] ={2.3,0.53,-0.44};    //two points are taken from the curve. 
                                                    //with these two points, a line is formed which is "approximately equivalent" 
                                                    //to the original curve.
                                                    //data format:{ x, y, slope}; point1: (lg200, 0.53), point2: (lg10000,  -0.22)                                                     
float           Ro           =  10;                 //Ro is initialized to 10 kilo ohms

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
  Serial.print("Calibrating...\n");                
  //Ro = MQCalibration(MQ2);                       //Calibrating the sensor. Please make sure the sensor is in clean air 
                                                    //when you perform the calibration                    
  Serial.print("Calibration is done...\n"); 
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

float MQCalibration(int mq_pin)
{
  int i;
  float val=0;
 
  for (i=0;i<CALIBARAION_SAMPLE_TIMES;i++) {            //take multiple samples
    val += MQResistanceCalculation(analogRead(mq_pin));
    delay(CALIBRATION_SAMPLE_INTERVAL);
  }
  val = val/CALIBARAION_SAMPLE_TIMES;                   //calculate the average value
 
  val = val/RO_CLEAN_AIR_FACTOR;                        //divided by RO_CLEAN_AIR_FACTOR yields the Ro 
                                                        //according to the chart in the datasheet 
 
  return val; 
}

float MQResistanceCalculation(int raw_adc)
{
  return ( ((float)RL_VALUE*(1023-raw_adc)/raw_adc));
}

float MQRead(int mq_pin)
{
  int i;
  float rs=0;
 
  for (i=0;i<READ_SAMPLE_TIMES;i++) {
    rs += MQResistanceCalculation(analogRead(mq_pin));
    delay(READ_SAMPLE_INTERVAL);
  }
 
  rs = rs/READ_SAMPLE_TIMES;
 
  return rs;  
}

int MQGetGasPercentage(float rs_ro_ratio, int gas_id)
{
  if ( gas_id == GAS_LPG ) {
     return MQGetPercentage(rs_ro_ratio,LPGCurve);
  } else if ( gas_id == GAS_CO ) {
     return MQGetPercentage(rs_ro_ratio,COCurve);
  } else if ( gas_id == GAS_SMOKE ) {
     return MQGetPercentage(rs_ro_ratio,SmokeCurve);
  }    
 
  return 0;
}

int  MQGetPercentage(float rs_ro_ratio, float *pcurve)
{
  return (pow(10,( ((log(rs_ro_ratio)-pcurve[1])/pcurve[2]) + pcurve[0])));
}

void smoke(int MQ2){
  int smokeSensor = analogRead(MQ2);
  Serial.print(",");Serial.print(smokeSensor);
  Serial.print(","); 
   Serial.print(MQGetGasPercentage(MQRead(MQ2)/Ro,GAS_LPG) );
   Serial.print( "," );  
   Serial.print(MQGetGasPercentage(MQRead(MQ2)/Ro,GAS_CO) ); 
   Serial.print(","); 
   Serial.print(MQGetGasPercentage(MQRead(MQ2)/Ro,GAS_SMOKE) );
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
