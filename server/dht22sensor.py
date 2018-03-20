import Adafruit_DHT as DHT
import paho.mqtt.client as paho
import time
import json
import random

broker = 'localhost'
port = 1883
sensor = DHT.DHT22
pin = '10'

def on_publish(client,userdata,result) :
	print("data published \n")


client1 = paho.Client("control1")
client1.on_publish = on_publish
client1.connect(broker,port)

while True :
	#humidity, temperature = DHT.read_retry(sensor,pin)
	humidity = random.randint(1,100)
	temperature = random.randint(1,100)
	if humidity is not None and temperature is not None :
		#rawData = 'IN,{0:0.1f},{1:0.1f}'.format(temperature,humidity)
		print(humidity, temperature)
		jsonData = json.dumps({
			"temperature" : temperature , 
			"humidity" : humidity
			})
		ret = client1.publish("dht22" , jsonData)
		client1.loop()

		#print(ret)
	else :
		print('Failed to get reading, Try again!')

	time.sleep(1)
