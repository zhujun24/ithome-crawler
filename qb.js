var cheerio = require('cheerio');
var request = require('request');
var async = require('async');

var concurrencyCount = 0;
var urls = [];
var i = 1;

var loadData = function (url) {
  return new Promise(function (resolve, reject) {
    var options = {
      url: url,
      headers: {
        'User-Agent': 'fuck'
      }
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
};

var fetchUrl = function (url, callback) {
  concurrencyCount++;
  console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url);
  loadData(url).then(function (res) {
    concurrencyCount--;
    callback(null, res);
  });
};

for (; i < 31; i++) {
  urls.push(`http://www.qiushibaike.com/8hr/page/${i}`);
}

async.mapLimit(urls, 5, function (url, callback) {
  fetchUrl(url, callback);
}, function (err, result) {
  var k = 0;
  var $;
  console.log('final:');
  for (; k < result.length; k++) {
    $ = cheerio.load(result[k]);
    console.log('============================');
    console.log($('.author').find('a').find('h2').text());
  }
});
