var co = require('co');
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var path = require('path');

var aidExp = /\/\d+/;
var commentExp = /unescape\('.*/;

var aidArr = [];
var done = [{
  type: '',
  sum: 0
}];

var loadData = function (url) {
  return new Promise(function (resolve, reject) {
    request(url, {timeout: 5000}, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        var result = {
          error: error ? error : "no error",
          statusCode: response && response.statusCode ? response.statusCode : '000'
        };
        reject(result);
      }
    });
  });
};

fs.writeFile(path.join(__dirname, 'log.log'), '');
fs.writeFile(path.join(__dirname, 'log.log'), 'Start at: ' + new Date() + '\n', {flag: 'a'});

var pageAccount = 1;
var gen1 = function*() {
  for (var i = 0; i < pageAccount; i++) {
    console.log('request page ' + (i + 1) + ' start!============');
    try {
      var result = yield loadData('http://www.ithome.com/list/list_' + (i + 1) + '.html');
      console.log('request page ' + (i + 1) + ' success!');
      var $ = cheerio.load(result);
      $('.ulcl>li:not(.hr)>a').each(function (index, element) {
        var aid = $(element).attr('href').match(aidExp)[0].substr(1);
        aidArr.push(aid);
      });
    } catch (error) {
      console.log(error);
    }
  }
};

co(gen1).then(function () {
  fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + JSON.stringify(aidArr, null, 2) + '\n', {flag: 'a'});
  var gen2 = function*() {
    for (var i = 0; i < aidArr.length; i++) {
      var url = 'http://www.ithome.com/ithome/CommentCount.aspx?newsid=' + aidArr[i];
      console.log('request: ' + aidArr[i] + ' start!============');
      try {
        var result = yield loadData(url);
        console.log('request: ' + aidArr[i] + ' success!');
        var hehe = result.match(commentExp)[0].substr(10);
        var html = hehe.substring(0, hehe.length - 2);
        var $ = cheerio.load(unescape(html));
        $('#ulcommentlist>li').each(function (index, element) {
          var hehehehe = $($(element).find('div.info.rmp')[0]).find('.mobile');
          if (hehehehe.length) {
            //var name = $(hehehehe).find('a').text();
            var type = $(hehehehe).attr('class').substr(7);
            var isExist = true;
            $(done).each(function (index2, element2) {
              if (element2.type === type) {
                element2.sum++;
                isExist = false;
                return false;
              }
            });
            if (isExist) {
              done.push({
                type: type,
                sum: 1
              });
            }
          } else {
            done[0].sum++;
          }
        });
      } catch (error) {
        console.log(error);
      }
    }
  };
  co(gen2).then(function () {
    console.log(JSON.stringify(done, null, 2));
    fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + JSON.stringify(done, null, 2) + '\n', {flag: 'a'});
  }).catch(function (error) {
    console.log("gen2 error: " + error);
  });
}).catch(function (error) {
  console.log("gen1 error: " + error);
});
