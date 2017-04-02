var humid = 0,
    temp = 0,
    moisture = 0,
    percentSiram = 0,
    accX = 0,
    accY = 0,
    accZ = 0,
    air = 0,
    pir = 0,
    co = 0,
    lpg = 0,
    arahAngin = 0;

var muncul = 0;
var LEDhidup;


var stage = Sprite3D.stage(document.querySelector("#sikap"));
            // "verbose" version
var box = Sprite3D.box( 421, 200, 5, "cube" ); //lebar tinggi panjang

function update() {
    var socket = io.connect();
    socket.on('kirim', function(data) {

        var Header = data.datahasil[0];
        humid = parseInt(data.datahasil[1]);
        temp = parseInt(data.datahasil[2]);
        //moisture = parseInt(data.datahasil[3]);
        
        air = parseInt(data.datahasil[3]);
        lpg = parseInt(data.datahasil[4]);
        co = parseInt(data.datahasil[5]);
        anySmoke = parseInt(data.datahasil[6]);
        pir = parseInt(data.datahasil[7]);
        arahAngin = parseInt(data.datahasil[8]);
        accX = parseInt(data.datahasil[8]);
        accY = parseInt(data.datahasil[9]);
        accZ = parseInt(data.datahasil[10]);

        box.rotation( accY, 360 - accX, accZ); //pitch yaw roll
        box.update();
        stage.appendChild(box);
        //Debug
        console.log(data.datahasil);
        ISPU.setCO(co);
       	// console.log(ISPU.getCO());
        // console.log(ISPU.getCO());
        // console.log(ISPU.Xa.CO[2]);
        // console.log(ISPU.Ia[0]);
        // console.log(rumusISPU(322,100,50,365,80));
        // console.log(rumusISPU(10,100,50,10,5));


        $("#rawdata").html(Header);
        $("#temperature").html(temp + '°C');
        $("#humidity").html(humid + '%');
        $("#moisture").html(moisture);
        $("#accX").html(accX);
        $("#accY").html(accY);
        $("#accZ").html(accZ);
        $("#air").html(air);
        $("#lpg").html(lpg);
        $("#co").html(co);
        $("#anySmoke").html(anySmoke);
        $("#motion").html(pir);

        percentSiram = (moisture / 1023) * 100;
        $("#maudisiram").css('width', percentSiram + '%').attr('aria-valuenow', percentSiram).html(parseInt(percentSiram) + " % Wet");

        if (parseInt(percentSiram) > 19 && parseInt(percentSiram) < 20) {
            muncul = 1;
            $.notify("Need Water!, do watering....", "success");
        } else {
            muncul = 0;
        }

        if (pir == 1 ) {
            $.notify("Any movement", "warn");
        } 
    
    });

    socket.on('button', function(data) {
        LEDhidup = data;
        if (data) {
            $("#LED").html("LED ON");
            ledBtn.turnOn();
        } else {
            $("#LED").html("LED OFF");
            ledBtn.turnOff();
        }
    });

    socket.on('tempDB', function(data){
        // console.log(data[0].id);
        // console.log(data[0].humid);
        // console.log(data[0].waktu);
        // paramSensor.setHumid(data[0].humid);
        // console.log(paramSensor.getHumid());
        // console.log(data.id);
        // console.log(data.humid);
        // console.log(data.waktu);
        //console.log(data);
    });

}

var dataSensor = {
    humid : '',
    waktu : '',
    setHumid : function(data){
        this.humid = data;
    },
    getHumid : function(){
        return this.humid;
    }
};

var paramSensor = dataSensor;


var ledBtn = {
    btn: document.getElementById("LED"),
    stat: document.getElementById("stats"),
    turnOn: function() {
        this.btn.className = "btn btn-info";
        this.btn.innerHTML = "LED ON";
        this.stat.innerHTML = "LED ON";
    },
    turnOff: function() {
        this.btn.className = "btn btn-default";
        this.btn.innerHTML = "LED OFF";
        this.stat.innerHTML = "LED OFF";
    }
};


function alertDiv() {
    if (muncul == 1) {
        var newNode = document.createElement('div');
        newNode.className = 'alert alert-success';
        newNode.innerHTML = '<strong> Success! </strong>, Watering..';
        setTimeout(function() {
            newNode.parentNode.removeChild(newNode);
        }, 2000);
        var sekali = 1;
        if (sekali == 1) {
            document.getElementById('watering').appendChild(newNode);
            sekali = 0;
        }
        muncul = 0;
    }
}

function stopSerial() {
    var socket = io.connect();

    socket.emit('stop', 0);
}


function watering() {
    var socket = io.connect();
    socket.emit('water', 4);
}

function startAgain() {
    var socket = io.connect();
    socket.emit('startAgain', 1);
}


function LedON() {
    var socket = io.connect();

    if (!LEDhidup) {
        ledBtn.turnOn();
        socket.emit('LedON', 2);
        LEDhidup = true;
    } else {
        ledBtn.turnOff();
        socket.emit('LedOff', 3);
        LEDhidup = false;
    }
    console.log(LEDhidup);
}


var chart;
$(document).ready(function() { 
    //time
    function clock() {
    document.getElementById("localtime").innerHTML = moment().format('MMMM Do YYYY, h:mm:ss a');
    }
    setInterval(clock, 1000);

    Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'zeroGraph1',
            defaultSeriesType: 'spline',
            events: {
                load: function () {

                        // set up the updating of the chart each second
                        var series = this.series[0];
                        setInterval(function () {
                            var x = (new Date()).getTime(), // current time
                                y = humid;
                            series.addPoint([x, y], true, true);
                        }, 1000);

                          var series1 = this.series[1];
                        setInterval(function () {
                            var x = (new Date()).getTime(), // current time
                                y = temp;
                            series1.addPoint([x, y], true, true);
                        }, 1000);
                    }
            }
        },
        title: {
            text: 'DHT11 Sensor'
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 150,
            crosshair : true,
            maxZoom: 20 * 1000
        },
        yAxis: {
            minPadding: 0.2,
            maxPadding: 0.2,
            crosshair : true,
            title: {
                text: 'Value',
                margin: 5
            }
        },
        series: [{
            name: 'Humidity',
            data: (function () {
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: humid
                        });
                    }
                    return data;
                }())
        },
        {
            name: 'Temperature',
            data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: temp
                        });
                    }
                    return data;
                }())
        }

        ]
    });

    Highcharts.chart('zeroGraph', {
        chart: {
            type: 'spline',
            events : {
                load : function() {
                        var series = this.series[0];
                        setInterval(function () {
                            var x = (new Date()).getTime(), // current time
                                y = Math.floor(ISPU.getCO());
                            series.addPoint([x, y], true, true);
                        }, 1000);
                }
            }
        },
        title: {
            text: 'MQ-2 Sensor'
        },
        xAxis: {
            type: 'datetime',
             crosshair : true,
            labels: {
                overflow: 'justify'
            }
        },
        yAxis: {
            title: {
                text: 'ISPU (Indeks Pencemaran Udara)'
            },
             crosshair : true,
            minorGridLineWidth: 0,
            gridLineWidth: 0,
            alternateGridColor: null,
            plotBands: [{ // Light air
                from: 0 ,
                to: 50,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'Sangat Baik',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Light breeze
                from: 50,
                to: 100,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'Baik',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Gentle breeze
                from: 100,
                to: 200,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'Sedang',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Moderate breeze
                from: 200,
                to: 300,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'Tidak Sehat',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Fresh breeze
                from: 300,
                to: 400,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'Sangat tidak sehat',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Strong breeze
                from: 400,
                to: 1000,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'Berbahaya',
                    style: {
                        color: '#606060'
                    }
                }
            }]
        },
        tooltip: {
            valueSuffix: ' Indeks'
        },
        plotOptions: {
            spline: {
                lineWidth: 4,
                states: {
                    hover: {
                        lineWidth: 5
                    }
                },
                marker: {
                    enabled: false
                }

            }
        },
        series: [{
            name: 'Carbon Monoxide',
            data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: Math.floor(ISPU.getCO())
                        });
                    }
                    return data;
                }())

        }],
        navigation: {
            menuItemStyle: {
                fontSize: '10px'
            }
        }
    });        


});


var ISPU = {
    Ia : [50 , 100 , 200 ,300 , 400, 500],
    Ib : [50 , 100 , 200 ,300 ,400 ,500],
    Xa : {
        CO : [5 , 10 , 17 ,34 ,46 , 57.5],
        PM10 : [50 , 150 , 350, 420, 500 ,600]
    },
    Xb : {
        CO : [5 , 10 , 17 ,34 ,46 , 57.5],
        PM10 : [50 , 150 , 350, 420, 500 ,600]
    },
    hasil : 0,
    setCO : function(data) {
        var convert = data * 2.62;
        //this.hasil = convert;
        if ( convert > 46){
           this.hasil =  rumusISPU(convert, this.Ia[5] , this.Ib[4] , this.Xa.CO[5] , this.Xb.CO[4]);
        } else if ( convert > 34 ){
           this.hasil = rumusISPU(convert , this.Ia[4] , this.Ib[3] , this.Xa.CO[4] , this.Xb.CO[3]);
        } else if (convert > 17) {
           this.hasil = rumusISPU(convert , this.Ia[3] , this.Ib[2] , this.Xa.CO[3] , this.Xb.CO[2]);
        } else if (convert > 10){
           this.hasil = rumusISPU(convert , this.Ia[2] , this.Ib[1] , this.Xa.CO[2] , this.Xb.CO[1]);
        } else if (convert > 5){
           this.hasil = rumusISPU(convert , this.Ia[1] , this.Ib[0] , this.Xa.CO[1] , this.Xb.CO[0]);
        } else {
           this.hasil = rumusISPU(convert, this.Ia[1] , 0 , this.Xa.CO[1] , 0);
        }
        // console.log(this.hasil);
        // console.log(this.Ia[2], this.Ib[1], this.Xa.CO[2]);
    },
    getCO : function() {
        return this.hasil;
    }
};


function rumusISPU( Xx, Ia , Ib , Xa , Xb){
    var data;

    data = ((Ia - Ib) / (Xa - Xb))*(Xx - Xb) + Ib;

    return data;
}

