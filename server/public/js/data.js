var humid = 0,
    temp = 0,
    moisture = 0,
    percentSiram = 0,
    accX = 0,
    accY = 0,
    accZ = 0,
    smoke = 0,
    pir = 0,
    co = 0,
    lpg = 0;

var muncul = 0;
var LEDhidup;

function update() {
    var socket = io.connect();
    socket.on('kirim', function(data) {

        var Header = data.datahasil[0];
        humid = parseInt(data.datahasil[1]);
        temp = parseInt(data.datahasil[2]);
        moisture = parseInt(data.datahasil[3]);
        accX = parseInt(data.datahasil[4]);
        accY = parseInt(data.datahasil[5]);
        accZ = parseInt(data.datahasil[6]);
        smoke = parseInt(data.datahasil[7]);
        lpg = parseInt(data.datahasil[8]);
        co = parseInt(data.datahasil[9]);
        anySmoke = parseInt(data.datahasil[10]);
        pir = parseInt(data.datahasil[11]);

        //Debug
        console.log(data.datahasil);
        ISPU.setCO(co);
        console.log(ISPU.getCO());
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
        $("#smoke").html(smoke);
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
            type: 'spline'
        },
        title: {
            text: 'MQ-2 Sensor'
        },
        xAxis: {
            type: 'datetime',
            labels: {
                overflow: 'justify'
            }
        },
        yAxis: {
            title: {
                text: 'Wind speed (m/s)'
            },
            minorGridLineWidth: 0,
            gridLineWidth: 0,
            alternateGridColor: null,
            plotBands: [{ // Light air
                from: 0 ,
                to: 1.5,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'Light air',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Light breeze
                from: 1.5,
                to: 3.3,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'Light breeze',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Gentle breeze
                from: 3.3,
                to: 5.5,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'Gentle breeze',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Moderate breeze
                from: 5.5,
                to: 8,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'Moderate breeze',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Fresh breeze
                from: 8,
                to: 11,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'Fresh breeze',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Strong breeze
                from: 11,
                to: 14,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'Strong breeze',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // High wind
                from: 14,
                to: 15,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'High wind',
                    style: {
                        color: '#606060'
                    }
                }
            }]
        },
        tooltip: {
            valueSuffix: ' m/s'
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
                },
                pointInterval: 3600000, // one hour
                pointStart: Date.UTC(2015, 4, 31, 0, 0, 0)
            }
        },
        series: [{
            name: 'Hestavollane',
            data: [0.2, 0.8, 0.8, 0.8, 1, 1.3, 1.5, 2.9, 1.9, 2.6, 1.6, 3, 4, 3.6, 4.5, 4.2, 4.5, 4.5, 4, 3.1, 2.7, 4, 2.7, 2.3, 2.3, 4.1, 7.7, 7.1, 5.6, 6.1, 5.8, 8.6, 7.2, 9, 10.9, 11.5, 11.6, 11.1, 12, 12.3, 10.7, 9.4, 9.8, 9.6, 9.8, 9.5, 8.5, 7.4, 7.6]

        }, {
            name: 'Vik',
            data: [0, 0, 0.6, 0.9, 0.8, 0.2, 0, 0, 0, 0.1, 0.6, 0.7, 0.8, 0.6, 0.2, 0, 0.1, 0.3, 0.3, 0, 0.1, 0, 0, 0, 0.2, 0.1, 0, 0.3, 0, 0.1, 0.2, 0.1, 0.3, 0.3, 0, 3.1, 3.1, 2.5, 1.5, 1.9, 2.1, 1, 2.3, 1.9, 1.2, 0.7, 1.3, 0.4, 0.3]
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
