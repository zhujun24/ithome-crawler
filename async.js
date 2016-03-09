var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var analyze = require('./analyze');
var fs = require('fs');
var path = require('path');

var aidExp = /\/\d+/;
var commentExp = /unescape\('.*/;
var listUrl = 'http://www.ithome.com/list/list_';
var commentUrl = 'http://www.ithome.com/ithome/CommentCount.aspx?newsid=';

var aidArr = [];
var allComment = 0;
var done = [{
  type: 'unknown',
  sum: 0
}];
var device = [{
  type: 'unknown',
  sum: 0
}];

var concurrencyCount = 0;
var pageAccount1 = 1;
var maxConcurrency = 10;

var loadData = function (url) {
  return new Promise(function (resolve, reject) {
    request(url, {timeout: 5000}, function (error, response, body) {
      var result;
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        result = {
          url: url,
          error: error || 'no error',
          statusCode: response && response.statusCode ? response.statusCode : '000'
        };
        reject(result);
      }
    });
  });
};

var crawlerComment = function () {
  async.mapLimit(aidArr, 200, function (url, callback) {
    // fetchUrl(url, callback);
    concurrencyCount++;
    // console.log('现在的并发数是', maxConcurrency, '，正在抓取的是', url);
    loadData(commentUrl + url).then(function (res) {
      var hehe = res.match(commentExp)[0].substr(10);
      var html = hehe.substring(0, hehe.length - 2);
      var $ = cheerio.load(unescape(html));
      concurrencyCount--;
      $('#ulcommentlist>li').each(function (index, element) {
        var hehehehe = $($(element).find('div.info.rmp')[0]).find('.mobile');
        var type = '';
        var deviceInfo = '';
        var isExist = true;
        var isDeviceExist = true;
        if (hehehehe.length) {
          // var name = $(hehehehe).find('a').text();
          allComment++;
          type = $(hehehehe).attr('class').substr(7);
          deviceInfo = $(hehehehe).find('a').eq(0).text();
          $(done).each(function (index2, element2) {
            if (element2.type === type) {
              element2.sum++;
              isExist = false;
              return false;
            }
            return true;
          });
          if (isExist) {
            done.push({
              type: type,
              sum: 1
            });
          }
          $(device).each(function (index2, element2) {
            if (element2.type === deviceInfo) {
              element2.sum++;
              isDeviceExist = false;
              return false;
            }
            return true;
          });
          if (isDeviceExist) {
            device.push({
              type: deviceInfo,
              sum: 1
            });
          }
        } else {
          done[0].sum++;
          device[0].sum++;
        }
      });
      console.log(`${url} are complete!`);
      callback(null, url);
    }, function (err) {
      concurrencyCount--;
      callback(null, err);
    });
  }, function (err, result) {
    console.log('final:');
    analyze.analyze(done, allComment, device);
    console.log(err, result);
  });
};

var crawlerList = function (pageAccount, crawlerComment1) {
  var pages = [];
  var i = 0;
  for (; i < pageAccount; i++) {
    pages.push(i + 1);
  }
  async.mapLimit(pages, maxConcurrency, function (url, callback) {
    concurrencyCount++;
    console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url);
    loadData(`${listUrl}${url}.html`).then(function (res) {
      var $ = cheerio.load(res);
      console.log(`request page ${url} success!`);
      $('.ulcl>li:not(.hr)>a').each(function (index, element) {
        var aid = $(element).attr('href').match(aidExp)[0].substr(1);
        aidArr.push(aid);
      });
      console.log(`${url} are complete!`);
      concurrencyCount--;
      callback(null, url);
    }, function (err) {
      concurrencyCount--;
      callback(null, err);
    });
  }, function (err, result) {
    console.log('==========aidArr final==========');
    console.log(aidArr);
    console.log(err, result);
    crawlerComment1();
  });
};

fs.writeFile(path.join(__dirname, 'log.log'), '');
fs.writeFile(path.join(__dirname, 'log.log'), `Start at: ${new Date()}\n`, {flag: 'a'});

crawlerList(pageAccount1, crawlerComment);
