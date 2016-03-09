var fs = require('fs');
var path = require('path');
var m = 0;
var i = 0;
var count1 = '';
var percent1 = '';
var str = '';
var logContent;

exports.analyze = function (done, allComment, device) {
  var result1 = done.sort(function (a, b) {
    return b.sum - a.sum;
  });
  var result2 = device.sort(function (a, b) {
    return b.sum - a.sum;
  });

  var formatLog = function (devices, count, percent) {
    var addSpace = function (string, num) {
      var result = '';
      var k = 0;
      for (; k < num; k++) {
        result += ' ';
      }
      return `${string}${result}`;
    };
    var str1 = '';
    str1 += addSpace(devices, 20 - devices.length);
    str1 += addSpace(count, 20 - count.length);
    str1 += `${percent}%`;
    return str1;
  };

  console.log(`All Comments: ${allComment}`);
  console.log('DeviceType          Count               Percent');
  logContent = `\nAll Comments: ${allComment}\n`;
  logContent += `DeviceType          Count               Percent\n`;
  fs.writeFile(path.join(__dirname, 'log.log'), logContent, {flag: 'a'});
  for (; i < result1.length; i++) {
    count1 = `${result1[i].sum}`;
    percent1 = `${(result1[i].sum / allComment * 100)}`;
    str = formatLog(result1[i].type, count1, percent1);
    console.log(str);
    fs.writeFile(path.join(__dirname, 'log.log'), `${str}\n`, {flag: 'a'});
  }

  console.log(`\nAll Devices: ${allComment}`);
  console.log('DeviceInfo          Count               Percent');
  logContent = `\nAll Devices: ${allComment}\DeviceInfo          Count               Percent\n`;
  fs.writeFile(path.join(__dirname, 'log.log'), logContent, {flag: 'a'});
  for (; m < result2.length; m++) {
    str = formatLog(result2[m].type, `${result2[m].sum}`, `${(result2[m].sum / allComment * 100)}`);
    console.log(str);
    fs.writeFile(path.join(__dirname, 'log.log'), `${str}\n`, {flag: 'a'});
  }
};
