var fs = require('fs');
var path = require('path');

exports.analyze = function (done, allComment, device) {
  var result1 = done.sort(function (a, b) {
    return b.sum - a.sum;
  });
  var result2 = device.sort(function (a, b) {
    return b.sum - a.sum;
  });

  var formatLog = function (device, count, percent) {
    var addSpace = function (string, num) {
      for (var i = 0; i < num; i++) {
        string += ' ';
      }
      return string;
    };
    var str = '';
    str += addSpace(device, 20 - device.length);
    str += addSpace(count, 20 - count.length);
    str += percent + '%';
    return str;
  };

  console.log('All Comments: ' + allComment);
  console.log('DeviceType          Count               Percent');
  fs.writeFile(path.join(__dirname, 'log.log'), '\nAll Comments: ' + allComment + '\nDeviceType          Count               Percent\n', {flag: 'a'});
  for (var i = 0; i < result1.length; i++) {
    var str = formatLog(result1[i].type, '' + result1[i].sum, '' + (result1[i].sum / allComment * 100));
    console.log(str);
    fs.writeFile(path.join(__dirname, 'log.log'), str + '\n', {flag: 'a'});
  }

  console.log('\nAll Devices: ' + allComment);
  console.log('DeviceInfo          Count               Percent');
  fs.writeFile(path.join(__dirname, 'log.log'), '\nAll Devices: ' + allComment + '\DeviceInfo          Count               Percent\n', {flag: 'a'});
  for (var i = 0; i < result2.length; i++) {
    var str = formatLog(result2[i].type, '' + result2[i].sum, '' + (result2[i].sum / allComment * 100));
    console.log(str);
    fs.writeFile(path.join(__dirname, 'log.log'), str + '\n', {flag: 'a'});
  }
};