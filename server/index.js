var SerialPort = require('serialport');
var express = require('express');
var app = express();
var path = require('path');

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
app.use(express.static(path.join(__dirname, 'public')));
var portNumber = 3030;
server.listen(portNumber);
var portName = process.argv[2];
var zeroPort = new SerialPort(
  portName,
  {
    baudRate : 9600,
    databits : 8,
    parity : 'none',
    parser : SerialPort.parsers.readline('\r\n')
  });
var jumlahClient = 0;
var dcClient = 0;
var datahasil = "";

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

  io.sockets.on('connection' , function(socket){
    jumlahClient++;
    console.log('Number of Client : ' + jumlahClient);
    zeroPort.on('data', function(data) {

        var RAWData = data.toString();
        RAWData = RAWData.replace(/(\r\n|\n|\r)/gm,"");
        var datahasil = RAWData.split(',');
        if (datahasil[0] == "OK" ) {
          socket.broadcast.emit('kirim', {datahasil:datahasil});
        }
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
  });
});
