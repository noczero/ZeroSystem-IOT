<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Document</title>
  <link rel="stylesheet" type="text/css" href="css/bootstrap.css">
</head>
<body onload="update()">
  <nav class="navbar navbar-default">
    <div class="container-fluid">
      <div class="navbar-header">
        <a class="navbar-brand" href="#">ZeroSystem-IOT</a>
      </div>
      <ul class="nav navbar-nav">
        <li class="active"><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
      </ul>
    </div>
  </nav>
  <div class="container">
    <table class="table">
      <caption>RAW Data</caption>
      <thead>
        <tr>
          <th>header</th>
          <th>Humidity</th>
          <th>Temperature</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td id="rawdata">data</td>
          <td id="humidity">data</td>
          <td id="temperature">data</td>
        </tr>
      </tbody>
    </table>
    
    <div>
      <a href="#" onclick="stopSerial() " class="btn btn-primary"> Stop</a>
    </div>

    <div id="zeroGraph" style="width:100%;height:300px">
    <div>
  </div>
</body>
<script src="js/jquery.js"></script>

<script src="js/bootstrap.js"></script>
<script src="plugins/flot/jquery.flot.js"></script>
<script src="js/data.js"></script>
<script src="/socket.io/socket.io.js"></script>

</html>