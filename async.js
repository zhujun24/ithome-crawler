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

var concurrencyCount = 0;
var pageAccount = 10;
var maxConcurrency = 20;

var loadData = function (url) {
  return new Promise(function (resolve, reject) {
    request(url, {timeout: 5000}, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        var result = {
          url: url,
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

var crawlerComment = function () {
  fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + JSON.stringify(aidArr, null, 2) + '\n', {flag: 'a'});
  fs.writeFile(path.join(__dirname, 'log.log'), 'Start at: ' + new Date() + '\n', {flag: 'a'});
  async.mapLimit(aidArr, 200, function (url, callback) {
    //fetchUrl(url, callback);
    concurrencyCount++;
    console.log('现在的并发数是', maxConcurrency, '，正在抓取的是', url);
    loadData(commentUrl + url).then(function (res) {
      concurrencyCount--;
      var hehe = res.match(commentExp)[0].substr(10);
      var html = hehe.substring(0, hehe.length - 2);
      var $ = cheerio.load(unescape(html));
      $('#ulcommentlist>li').each(function (index, element) {
        var hehehehe = $($(element).find('div.info.rmp')[0]).find('.mobile');
        if (hehehehe.length) {
          //var name = $(hehehehe).find('a').text();
          allComment++;
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
      console.log(url + ' are complete!');
      callback(null, url);
    }, function (err) {
      concurrencyCount--;
      callback(null, err);
    });
  }, function (err, result) {
    console.log('final:');
    analyze.analyze(done, allComment);
    fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + JSON.stringify(done, null, 2) + '\n', {flag: 'a'});
  });
};

var crawlerList = function (pageAccount, crawlerComment) {
  var pages = [];
  for (var i = 0; i < pageAccount; i++) {
    pages.push(i + 1);
  }
  async.mapLimit(pages, maxConcurrency, function (url, callback) {
    concurrencyCount++;
    console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url);
    loadData(listUrl + url + '.html').then(function (res) {
      console.log('request page ' + url + ' success!');
      var $ = cheerio.load(res);
      $('.ulcl>li:not(.hr)>a').each(function (index, element) {
        var aid = $(element).attr('href').match(aidExp)[0].substr(1);
        aidArr.push(aid);
      });
      console.log(url + ' are complete!');
      concurrencyCount--;
      callback(null, url);
    }, function (err) {
      concurrencyCount--;
      callback(null, err);
    });
  }, function (err, result) {
    console.log('==========aidArr final==========');
    console.log(aidArr);
    crawlerComment();
  });
};

crawlerList(pageAccount, crawlerComment);