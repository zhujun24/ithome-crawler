var co = require('co');
var cheerio = require('cheerio');
//var config = require('./config').Param;
var request = require('request');
var fs = require('fs');
var path = require('path');

//fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + 'DB Connect ERROR: ' + err + '\n\n', {
//  flag: 'a'
//});
var oldTimer = '';
var gen = function*() {
  for (var i = 3200; ; i++) {
    var result = yield loadData('http://www.ithome.com/list/list_' + (i + 1) + '.html');
    var $ = cheerio.load(result);
    var timer = $('.ulcl>li').eq(0).find('span.cate').html();
    if (timer === oldTimer) {
      break;
      //return false;
    } else {
      console.log(i + 1);
      console.log(timer);
      oldTimer = timer;
    }
  }
};

var loadData = function (item) {
  return new Promise(function (resolve, reject) {
    request(item, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
};

co(gen).then(function () {
  //console.log('Generator 函数执行完成');
}).catch(function (error) {
  console.log(error);
  fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + error + '\n\n', {
    flag: 'a'
  });
});
