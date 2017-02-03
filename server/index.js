var SerialPort = require('serialport');
var express = require('express');
var app = express();
var php = require('php-node');
var path = require('path');
require('events').EventEmitter.defaultMaxListeners = Infinity;
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
app.use(express.static(path.join(__dirname, 'public')));
var portNumber = 3030;
server.listen(portNumber);
var portName = process.argv[2];

var mysql = require('mysql');
var zeroDB = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '',
  database : 'zeroWeather'
});

zeroDB.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('Success, Database connected... \n connected as id ' + zeroDB.threadId);
  
});
var datahasil , RAWData;
var zeroPort = new SerialPort(
  portName,
  {
    baudRate : 115200,
    databits : 8,
    parity : 'none',
    parser : SerialPort.parsers.readline('\r\n')
  });
var jumlahClient = 0;
var dcClient = 0;
var hidup = false;

function insertHumid(data){
  zeroDB.query('INSERT INTO humidity SET humid=? ' , data ,function(err, result) { 
    if(err){
      console.log(err);
    } else {
      console.log('Success : Data berhasil diinput');
    }
  });
}

zeroPort.on('open', function() {
  console.log('ZeroSystem-IoT Started');
  console.log('======================');
  console.log('Port Open, Server on port ' + portNumber);

  var delayMillis = 3000; //3 second
  setTimeout(function() {
    //your code to be executed after 3 second
    zeroPort.write('1', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('Started....');
    });
  }, delayMillis);

  //getData
  var temp ; 
  zeroDB.query('SELECT * FROM humidity' , function (error, results, fields) {
            temp = results;
          });
  
  setInterval(function(){insertHumid(datahasil[1])}, 1200000);


  io.on('connection' , function(socket){
      jumlahClient++;
      console.log('Number of Client : ' + jumlahClient);
      zeroPort.on('data', function(data) {
         RAWData = data.toString();
          RAWData = RAWData.replace(/(\r\n|\n|\r)/gm,"");
          datahasil = RAWData.split(',');
          //insertHumid(datahasil[1]);
          if (datahasil[0] == "OK" ) {
            socket.emit('kirim', {datahasil:datahasil});
          }
          socket.emit('button', hidup );
          socket.emit('tempDB',  temp);

       

        });
         

      socket.on('disconnect' , function() {
          dcClient++;
          console.log('1 client disconnected , Total : ' + dcClient);
          jumlahClient--;
          console.log('Number of Client : ' + jumlahClient);
      });

      socket.on('stop' , function(data) {
          zeroPort.write('0');
      });

      socket.on('startAgain', function(data){
        zeroPort.write('1');
      });
    
      socket.on('LedON' , function(data){
        zeroPort.write('2');
        hidup = true;
      });

      socket.on('LedOff', function(data){
        zeroPort.write('3');
        hidup = false;
      });

      socket.on('water', function(data){
        zeroPort.write('4');
      });



    });
});
