var humid = 0,
    temp = 0,
    moisture = 0,
    percentSiram = 0,
    accX = 0,
    accY = 0,
    accZ = 0,
    air = 0,
    pir = 0,
    CO2 = 0,
    co = 0,
    lpg = 0,
    arahAngin = 0,
    windvelo,lux,rain,smoke,smoke2,humidDHT = 0, humidNew = 0, tempNew = 0, LDR = 0,
    tempDHT = 0;

var muncul = 0;
var LEDhidup;


var stage = Sprite3D.stage(document.querySelector("#sikap"));
            // "verbose" version
var box = Sprite3D.box( 421, 200, 5, "cube" ); //lebar tinggi panjang

function update() {
    var socket = io.connect();
    socket.on('kirim', function(data) {
        //console.log(data);
        // header,humid,temp,smoke,LPG,CO2,smoke(IN),motion,rain
        //OK,44,0,0,0,0,1,32,55,456.25,0
            /*
            [0] = HEADER
            [1] = RAW GAS
            [2] = LPG
            [3] = CO
            [4] = SMOKE
            [5] = MOTION
            [6] = RAINDROP
            [7] = TEMP
            [8] = HUMID
            [9] = CO2
            [10] = LDR 
            */
        console.log(data);
        var Header = data.datahasil[0];
        humid = 0;
        temp =0;
        co = parseInt(data.datahasil[3]);
        lpg = parseInt(data.datahasil[2]);
        smoke2 = parseInt(data.datahasil[4]);
        pir = parseInt(data.datahasil[5]);
        rain = parseInt(data.datahasil[6]);
        tempNew = parseInt(data.datahasil[7]);
        humidNew = parseInt(data.datahasil[8]);
        CO2 = co2Correction(data.datahasil[9],467.11,tempNew); // from sensor sensirion
        LDR = parseInt(data.datahasil[10]);
        // accX = parseInt(data.datahasil[8]);
        // accY = parseInt(data.datahasil[9]);
        // accZ = parseInt(data.datahasil[10]);

        box.rotation( accY, 360 - accX, accZ); //pitch yaw roll
        box.update();
        stage.appendChild(box);
        //Debug
        //console.log(data.datahasil);
        $("#CO2").html(CO2);
        //CO2 = smoke;
        ISPU.setCO(co);
       	// console.log(ISPU.getCO());
        // console.log(ISPU.getCO());
        // console.log(ISPU.Xa.CO2[2]);
        // console.log(ISPU.Ia[0]);
        // console.log(rumusISPU(322,100,50,365,80));
        // console.log(rumusISPU(10,100,50,10,5));


        $("#rawdata").html(Header);
        $("#temperature").html(tempNew + '°C');
        $("#humidity").html(humidNew + '%');
        //$("#press").html(press);
        // $("#accX").html(accX);
        // $("#accY").html(accY);
        // $("#accZ").html(accZ);
        $("#co").html(co);
        $("#smoke2").html(smoke2);
        $("#lpg").html(lpg);
        $("#arahAngin").html(arahAngin);
        
        $("#rain").html(rain);
        $("#pir").html(pir);
        $("#LDR").html(LDR);
        //$("#humidNew").html(humidNew +'%');
        //$("#tempNew").html(tempNew + '°C');

        percentSiram = (rain / 1023) * 100;
        $("#maudisiram").css('width', percentSiram + '%').attr('aria-valuenow', percentSiram).html(parseInt(percentSiram) + " % Wet");

        if (parseInt(percentSiram) > 50 ) {
            muncul = 1;
            $.notify("It's raining...");
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

    socket.on('dataDHT22' ,  function(data) {
       // tipe data JSON
       // { 'temperature ' : 0 , 'humidity' : 0 } di parse kemudian dikirim sebagai object
       //console.log(data.temperature); //panggil nilai
       tempDHT = parseInt(data.temperature.toFixed(2));
       humidDHT = parseInt(data.humidity.toFixed(2));
      $('#dht22_temperature').html(data.temperature.toFixed(2) + ' °C');
      $('#dht22_humidity').html(data.humidity.toFixed(2) + ' %'); 
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

/**
 * Source :
 * http://www.vaisala.com/Vaisala%20Documents/Application%20notes/CEN-TIA-Parameter-How-to-measure-CO2-Application-note-B211228EN-A.pdf
 * where ppm is Co2 , hpa is pressure , and tmp is temperature
 */

function co2Correction(ppm , hpa , temp) {
  ppm = parseInt(ppm);
  //hpa = parseInt(hpa);
  hpa = 467.11;
  temp = parseInt(temp);

  return ((ppm * (hpa / 1013) * (298/(273 + temp))) + 55).toFixed(2);
}

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


var chart,chartDHT22;
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
                                y = humidNew;
                            series.addPoint([x, y], true, true);
                        }, 1000);

                          var series1 = this.series[1];
                        setInterval(function () {
                            var x = (new Date()).getTime(), // current time
                                y = tempNew;
                            series1.addPoint([x, y], true, true);
                        }, 1000);

                        // var series2 = this.series[2];
                        // setInterval(function () {
                        //     var x = (new Date()).getTime(), // current time
                        //         y = tempNew;
                        //     series2.addPoint([x, y], true, true);
                        // }, 1000);

                        //  var series3 = this.series[3];
                        // setInterval(function () {
                        //     var x = (new Date()).getTime(), // current time
                        //         y = humidNew;
                        //     series3.addPoint([x, y], true, true);
                        // }, 1000);
                    }
            }
        },
        title: {
            text: 'Temperature & Humidity Outdoor (DHT11)'
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
            name: 'Humidity New',
            data: (function () {
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: humidNew
                        });
                    }
                    return data;
                }())
        },
        {
            name: 'Temperature New',
            data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: tempNew
                        });
                    }
                    return data;
                }())
        }
        // {
        //     name: 'Temperature New',
        //     data: (function () {
        //             // generate an array of random data
        //             var data = [],
        //                 time = (new Date()).getTime(),
        //                 i;

        //             for (i = -19; i <= 0; i += 1) {
        //                 data.push({
        //                     x: time + i * 1000,
        //                     y: tempNew
        //                 });
        //             }
        //             return data;
        //         }())
        // },
        // {
        //     name: 'Humidity New',
        //     data: (function () {
        //             // generate an array of random data
        //             var data = [],
        //                 time = (new Date()).getTime(),
        //                 i;

        //             for (i = -19; i <= 0; i += 1) {
        //                 data.push({
        //                     x: time + i * 1000,
        //                     y: humidNew
        //                 });
        //             }
        //             return data;
        //         }())
        // }

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
            text: 'Carbon Monoxide'
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
                text: 'CO (Carbon Monoxide) level'
                //https://www.kane.co.uk/knowledge-centre/what-are-safe-levels-of-co-and-co2-in-rooms
            },
             crosshair : true,
            minorGridLineWidth: 0,
            gridLineWidth: 0,
            alternateGridColor: null,

            plotBands: [{ // Light air
                from: 400 ,
                to: 450,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'CO Max prolonged exposure (ASHRAE standard)', 
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Light breeze
                from: 9,
                to: 35,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'CO Max exposure for 8 hour work day (OSHA)',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Gentle breeze
                from: 35,
                to: 800,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'CO Death within 2 to 3 hours',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Moderate breeze
                from: 800,
                to: 12800,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'CO Death within 1 to 3 minutes',
                    style: {
                        color: '#606060'
                    }
                }
            }
            ]
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

    chartDHT22 = new Highcharts.Chart({
        chart: {
            renderTo: 'zeroGraphDHT22',
            defaultSeriesType: 'spline',
            events: {
                load: function () {

                        // set up the updating of the chart each second
                        var series = this.series[0];
                        setInterval(function () {
                            var x = (new Date()).getTime(), // current time
                                y = humidDHT;
                            series.addPoint([x, y], true, true);
                        }, 1000);

                          var series1 = this.series[1];
                        setInterval(function () {
                            var x = (new Date()).getTime(), // current time
                                y = tempDHT;
                            series1.addPoint([x, y], true, true);
                        }, 1000);
                    }
            }
        },
        title: {
            text: 'Temperature & Humidity Indoor (DHT22)'
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
                            y: humidDHT
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
                            y: tempDHT
                        });
                    }
                    return data;
                }())
        }

        ]
    });   

    //CO2
     Highcharts.chart('zeroGraphCO2', {
        chart: {
            type: 'spline',
            events : {
                load : function() {
                        var series = this.series[0];
                        setInterval(function () {
                            var x = (new Date()).getTime(), // current time
                                y = parseInt(CO2);
                            series.addPoint([x, y], true, true);
                        }, 1000);
                }
            }
        },
        title: {
            text: 'Carbon Dioxide'
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
                text: 'CO (Carbon Dioxide) Level'
            },
             crosshair : true,
            minorGridLineWidth: 0,
            gridLineWidth: 0,
            alternateGridColor: null,
            plotBands: [{ // Light air
                from: 250 ,
                to: 350,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'Normal',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Light breeze
                from: 350,
                to: 1000,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'Concentrations typical of occupied indoor spaces with good air exchange',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Gentle breeze
                from: 1000,
                to: 2000,
                color: 'rgba(68, 170, 213, 0.1)',
                label: {
                    text: 'Complaints of drowsiness and poor air.',
                    style: {
                        color: '#606060'
                    }
                }
            }, { // Moderate breeze
                from: 2000,
                to: 5000,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'Headaches, sleepiness and stagnant, stale, stuffy air. Poor concentration, loss of attention, increased heart rate and slight nausea may also be present',
                    style: {
                        color: '#606060'
                    }
                }
            },  { // Strong breeze
                from: 5000,
                to: 40000,
                color: 'rgba(0, 0, 0, 0)',
                label: {
                    text: 'Workplace exposure limit (as 8-hour TWA) in most jurisdictions',
                    style: {
                        color: '#606060'
                    }
                }
            }]
        },
        tooltip: {
            valueSuffix: ' ppm'
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
            name: 'Carbon Dioxide',
            data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: parseInt(CO2)
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

