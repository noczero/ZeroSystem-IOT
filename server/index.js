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

/*=====================================
=            Postgress SQL            =
=====================================*/
const postgress = require('pg');
const config = {
    user: 'pi',
    database: 'zeroWeather',
    password: 'noczero',
    port: 5432
};

const pool = new postgress.Pool(config);
//postgres://dbusername:passwrod@server:port/database
const connectionString = process.env.DATABASE_URL || 'postgres://pi:noczero@localhost:5432/zeroWeather';

function insertIndoor(){ 
	pool.connect((err,client,done) => {
		if(err){
			done();
			console.log(err);
		}
		if (dataDHT22 != undefined) {
			const queryString = "INSERT INTO dhtindoor (temperature,humidity) VALUES (" +  [dataDHT22.temperature, dataDHT22.humidity].join(",")  + ")";
			
			client.query(queryString , (err,result) => {
				if(err)
					console.log(err)
				else
					console.log('insert DHT indoor success...');

				done();

			});
		}
	});
} 

function insertOutdoor(){ 
	pool.connect((err,client,done) => {
		if(err){
			done();
			console.log(err);
		}
		if ((tempOut != undefined) && (humidOut != undefined) ) {
			const queryString = "INSERT INTO dhtoutdoor (temperature,humidity) VALUES (" +  [tempOut, humidOut].join(",")  + ")";
			
			client.query(queryString , (err,result) => {
				if(err)
					console.log(err)
				else
					console.log('insert DHT outdoor success...');

				done();

			});
		}
	});
} 

function getIndoor(){
	const results = []; 
	pool.connect((err,client,done) => {
		if(err){
			done();
			console.log(err);
		} else {
			const queryString = "SELECT * FROM dhtindoor";

			client.query(queryString, (err,result) => {
				if(err){
					console.log(err);
				} else {
					//console.log(result.rows);
					results.push(result.rows);
				}
				done();
		
			});
		}
	});
	return results;
}
//getIndoor();

/*=====  End of Postgress SQL  ======*/
/*===================================
=            API Express            =
===================================*/
app.get('/api/v1/indoor', (req,res,next) => {
	 //let result = getIndoor();
	//const results; 
	pool.connect((err,client,done) => {
		if(err){
			done();
			console.log(err);
		} else {
			const queryString = "SELECT * FROM dhtindoor";

			client.query(queryString, (err,result) => {
				if(err){
					console.log(err);
				} else {
					//console.log(result.rows);
					
					 res.json(result);

				}

				done();
		
			});
		}
	});
});

app.get('/api/v1/outdoor', (req , res) => {
	pool.connect((err,client,done) => {
		if(err){
			console.log(err);
			done();
		}

	     const getQuery = 'SELECT * FROM dhtoutdoor';
	    client.query(getQuery, (err,result) => {
	    	if(err){
	    		console.log(err);
	    	}else{
	    		res.send(result);
	    	}
            done();
	    })
	});
});


/*=====  End of API Express  ======*/


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
/*================================
=            Cron Job            =
================================*/
const cron = require('cron').CronJob;
const turningONLED = new cron({
	cronTime : '00 16 18 * * *',
	onTick : () => {
		if(!hidup) {

			port.write('2', (err) => {
				if(err)
					console.log(err.message);
				else 
					hidup = true;
			});
		}
	},
	start : false,
	timeZone : 'Asia/Jakarta'
});

const turningOFFLED = new cron({
	cronTime : '00 32 22 * * *',
	onTick : () => {
		if(hidup) {		
			port.write('3', (err) => {
				if(err)
					console.log(err.message);
				else
					hidup = false;
			});
		}
	},
	start : false,
	timeZone : 'Asia/Jakarta'
});
/*=====  End of Cron Job  ======*/



const insertDB = new cron({
	cronTime : '00 01 * * * *',
	onTick : () => {
		insertIndoor(); 
	},
	start : false,
	timeZone : 'Asia/Jakarta'
});



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
	//dont at below, it will stuck to on antoher event
});



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

let tempOut, humidOut;
parser.on('data' , (data) => {
		let RAWData, dataHasil;
		RAWData = data.toString();
		RAWData = RAWData.replace(/(\r\n|\n|\r)/gm, '');
		dataHasil = RAWData.split(',');

		if (dataHasil[0] == "OK" ) {
			//console.log(dataHasil);

			io.sockets.emit('kirim' , {datahasil : dataHasil});
			tempOut = dataHasil[10];
			humidOut = dataHasil[9]; 
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
	dataDHT22 = JSON.parse(message.toString());
	io.sockets.emit('dataDHT22' , dataDHT22);
	//console.log(dataDHT22.temperature);
}

function mqtt_close(){
	console.log("Close MQTT");
}

// /*=====  End of MQTT  ======*/





/*================================
=            Interval            =
================================*/

setInterval( () => {
	insertIndoor();
	insertOutdoor();
},1000*60*10); //every 10 menit


/*=====  End of Interval  ======*/




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