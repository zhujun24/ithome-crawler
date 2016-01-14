exports.analyze = function (done, allComment) {
  result = done.sort(function (a, b) {
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
    str += addSpace(device, 12 - device.length);
    str += addSpace(count, 12 - count.length);
    str += percent + '%';
    console.log(str);
  };

  console.log('All comments: ' + allComment);
  console.log('Device      Count       Percent\n');
  for (var i = 0; i < result.length; i++) {
    formatLog(result[i].type, '' + result[i].sum, '' + (result[i].sum / allComment * 100));
  }
};