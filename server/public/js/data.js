var humid = 0,
    temp = 0,
    moisture = 0;

var muncul = 0;
function update() {
  var socket = io.connect();

  socket.on('kirim', function(data){
     var Header = data.datahasil[0];
         humid = parseInt(data.datahasil[1]);
         temp = parseInt(data.datahasil[2]);
         moisture = parseInt(data.datahasil[3]);

      console.log(data.datahasil);
    $("#rawdata").html(Header);
    $("#temperature").html(temp);
    $("#humidity").html(humid);
    $("#moisture").html(moisture);

    var percentSiram = (moisture / 1023) * 100;
    $("#maudisiram").css('width', percentSiram+'%').attr('aria-valuenow', percentSiram).html(parseInt(percentSiram) + " % Dry"); 

    if (parseInt(percentSiram) > 0 && parseInt(percentSiram) < 10 ){
        muncul = 1;
       // alertDiv();
       $.notify("Need Water!, do watering....", "success");
    } else {
      muncul = 0;
    }
    
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

function alertDiv(){
  if (muncul == 1) {
   var newNode = document.createElement('div');
        newNode.className = 'alert alert-success';
        newNode.innerHTML = '<strong> Success! </strong>, Watering..';
        setTimeout(function()
         {
           newNode.parentNode.removeChild(newNode);
         },2000);
        var sekali = 1;
        if (sekali == 1) {
          document.getElementById('watering').appendChild(newNode);
          sekali = 0;
        }
        muncul = 0;  
  }
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

function watering(){
  var socket = io.connect();
  socket.emit('water',2);
}

function startAgain(){
  var socket = io.connect();
  socket.emit('startAgain',1);
}