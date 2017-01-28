function update() {
  var socket = io.connect();

  socket.on('kirim', function(data){
     var Header = data.datahasil[0];
      var   temp = parseInt(data.datahasil[1]);
       var  humid = parseInt(data.datahasil[2]);

      console.log(data.datahasil);
    $("#rawdata").html(Header);
    $("#temperature").html(temp);
    $("#humidity").html(humid);
  });
}

function stopSerial(){
  var socket = io.connect();

  socket.emit('stop', 0);
}

