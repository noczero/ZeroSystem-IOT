var humid = 0;
var temp = 0;
function update() {
  var socket = io.connect();

  socket.on('kirim', function(data){
     var Header = data.datahasil[0];
         humid = parseInt(data.datahasil[1]);
         temp = parseInt(data.datahasil[2]);

      console.log(data.datahasil);
    $("#rawdata").html(Header);
    $("#temperature").html(temp);
    $("#humidity").html(humid);
    
     //Push new value to Flot Plot
        HumidRes.push([totalPoints, humid]);
        HumidRes.shift();

        TempRes.push([totalPoints, temp]);
        TempRes.shift();

        for (i=0;i<totalPoints; i++) { 
          HumidRes[i][0]=i;
          TempRes[i][0]=i;
        }
  });
}

function stopSerial(){
  var socket = io.connect();

  socket.emit('stop', 0);
}

var totalPoints = 300;
var HumidRes = [],
    TempRes = [];


function getHumidData(){
  for (var i =0; i < totalPoints; ++i){
    HumidRes.push([i,0]);
  }
  return HumidRes;
}

function getTempData(){
  for (var i = 0; i < totalPoints; ++i){
      TempRes.push([i,0]); 
  }
      return TempRes;
}

var updateInterval = 30;
  var plot = $.plot("#zeroGraph", [ 
    { data : getHumidData() , label : "Kelembaban" },
    { data : getTempData() , label : "Temperature" }
   ] , {
        series: {
          shadowSize: 0 // Drawing is faster without shadows
        },
        yaxis: {
          min: 0,
          max: 100
        },
        xaxis: {
          show: false
        }
      });


function updategraph() {

  plot.setData([ 
    {data : HumidRes}, 
    {data : TempRes} ]);

  // Since the axes don't change, we don't need to call plot.setupGrid()

  plot.draw();
  setTimeout(updategraph, updateInterval);
}

updategraph();