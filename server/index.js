'use strict';

// use readline parser
/*----------  SerialPort  ----------*/

const SerialPort = require('serialport');
const parsers = SerialPort.parsers;

const parser = new parsers.Readline({
	delimiter : '\r\n'
});

const portName = process.argv[2] || '/dev/ttyACM0' ; //get port from the command
const port = new SerialPort(
	portName , 
	{
		baudRate : 115200 
	}
);
port.pipe(parser); // using parser 


/*----------  Express & Socket IO ----------*/
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const portWeb = process.env.PORT || 3000; //process.env.port use with command PORT='someport' in node or default 3000

//config express for using json
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended : false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('json spaces' , 4);

http.listen(portWeb, () => {
  console.log('listening on *:${portWeb}');
});

// LED variable
let hidup = false, nyala = false;




/*==============================
=            Python            =
==============================*/
// const PythonShell = require('python-shell');
// const fileName = 'dht22sensor.py';
// const dht22Python = new PythonShell(fileName);
// let dataDHT22 = [];
// dht22Python.on('message' , (message) => {
// 	let RAWData, dataHasil;
// 	RAWData = message.toString();
// 	RAWData = RAWData.replace(/(\r\n|\n|\r)/gm, '');
// 	dataHasil = RAWData.split(',');
// 	dataDHT22 = dataHasil;
// 	console.log(dataHasil);
// });

/*=====  End of Python  ======*/






/*----------  Main   ----------*/
port.on('open' , () => {
	console.log('Serial Port Starting... \n Serial Port Open...');

	// waiting open and send some command
	let delayMilis = 3000;
	setTimeout( () => {
		// send 1 to start
		port.write('1' , (err) => {
			if (err)
				return console.log('Error on write : ' , err.message);
			console.log('Connected... ');
		});


	}, delayMilis);

});
/*================================
=            Cron Job            =
================================*/
const cron = require('cron').CronJob;
const turningONLED = new cron({
	cronTime : '00 00 18 * * *',
	onTick : () => {
		if(!hidup)
			port.write('2', (err) => {
				if(err)
					console.log(err.message);
			});
	},
	start : false,
	timeZone : 'Asia/Jakarta'
});
turningONLED.start();

const turningOFFLED = new cron({
	cronTime : '00 00 06 * * *',
	onTick : () => {
		if(hidup)
			port.write('3', (err) => {
				if(err)
					console.log(err.message);
			});
	},
	start : false,
	timeZone : 'Asia/Jakarta'
});
turningOFFLED.start();
/*=====  End of Cron Job  ======*/


/*==================================
=            Socket.io             =
==================================*/
let countConnected = 0 , dcClient = 0;
io.on('connection', (socket) => {
	countConnected++;
	console.log('a user connected ' + countConnected);

	

	socket.on('disconnect' , () => {
		dcClient++;
		countConnected--;
		console.log('Client Disconnect..')
		console.log('Online : ' + countConnected + 'Offline : ' + dcClient);
	});

	socket.on('stop' , (data) => {
		port.write('0' , (err) => {
			if(err)
				console.log(err.message);
		});
	});

	socket.on('startAgain' , (data) => {
		port.write('1' , (err) => {
			if(err)
				console.log(err.message);
		});
	});

	socket.on('LedON' , (data) => {
		port.write('2', (err) => {
			if(err)
				console.log(err.message);
			else 
				hidup = true;
		});
	});

	socket.on('LedOff' , (data) => {
		port.write('3', (err) => {
			if (err)
				console.log(err.message);
			else
				hidup = false;
		});
	});
});


parser.on('data' , (data) => {
		let RAWData, dataHasil;
		RAWData = data.toString();
		RAWData = RAWData.replace(/(\r\n|\n|\r)/gm, '');
		dataHasil = RAWData.split(',');

		if (dataHasil[0] == "OK" ) {
			//console.log(dataHasil);

			io.sockets.emit('kirim' , {datahasil : dataHasil});
			
		}

		io.sockets.emit('button' , hidup);
		//io.sockets.emit('tempDB' , temp);
	});


// /*=====  End of Socket.io   ======*/

// /*============================
// =            MQTT            =
// ============================*/
const mqtt = require('mqtt');
const topic = '#'; //subscribe to all topics
const broker_server = 'mqtt://localhost';

const options = {
	clientId : 'MyMQTT',
	port : 1883,
	keepalive : 60
}

let clientMqtt = mqtt.connect(broker_server,options);
clientMqtt.on('connect', mqtt_connect);
clientMqtt.on('reconnect', mqtt_reconnect);
clientMqtt.on('error', mqtt_error);
clientMqtt.on('message', mqtt_messageReceived);
clientMqtt.on('close', mqtt_close);

function mqtt_connect() {
	clientMqtt.subscribe(topic, mqtt_subscribe);
}

function mqtt_subscribe(err, granted) {
	console.log("Subscribed to " + topic);
	if (err)
		console.log(err);
}

function mqtt_reconnect(err){
	clientMqtt = mqtt.connect(broker_server, options); // reconnect
}

function mqtt_error(err){
	console.log(err);
}

function after_publish() {
	//call after publish
}

let dataDHT22;
function mqtt_messageReceived(topic , message , packet){
	//console.log('Message received : ' + message);
	//console.log('Topic :' + topic);
	io.sockets.emit('dataDHT22' , JSON.parse(message.toString()));
}

function mqtt_close(){
	console.log("Close MQTT");
}

// /*=====  End of MQTT  ======*/


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) {
    	port.close(function (err) {
		    console.log('port closed', err);
		});
    	console.log('clean');
    }
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));