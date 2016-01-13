var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var http = require('http');
var request = require('request');
var BufferHelper = require('bufferhelper');
var async = require('async');
var eventproxy = require('eventproxy');

var loadData = function (url) {
  return new Promise(function (resolve, reject) {
    var options = {
      url: url,
      headers: {
        'User-Agent': 'fuck'
      }
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
};


var urls = [];
for (var i = 1; i < 31; i++) {
  urls.push('http://www.qiushibaike.com/8hr/page/' + i);
}

var async = require('async');

var concurrencyCount = 0;
var fetchUrl = function (url, callback) {
  concurrencyCount++;
  console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url);
  loadData(url).then(function (res) {
    concurrencyCount--;
    callback(null, res);
  });
};

async.mapLimit(urls, 5, function (url, callback) {
  fetchUrl(url, callback);
}, function (err, result) {
  console.log('final:');
  for (var i = 0; i < result.length; i++) {
    var $ = cheerio.load(result[i]);
    console.log('================================================================================================================================');
    console.log($('.author').find('a').find('h2').text());
  }
});