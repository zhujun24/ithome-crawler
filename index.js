var co = require('co');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var http = require('http');
var BufferHelper = require('bufferhelper');
var request = require('request');
var async = require('async');
var fs = require('fs');
var path = require('path');

var aidExp = /\/\d+/;
var commentExp = /unescape\('.*/;

var maxConcurrent = 10;//最大并发数
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
        console.log(error);
        reject(error);
      }
    });

    //var req = http.request(url, function (res) {
    //  var bufferHelper = new BufferHelper();
    //  res.setTimeout(5000, function () {
    //    console.log('===============================================');
    //    console.log(url + ' timeout!');
    //  });
    //  res.on('data', function (chunk) {
    //    bufferHelper.concat(chunk);
    //  });
    //  res.on('end', function () {
    //    var bufferhelper = bufferHelper.toBuffer();
    //    resolve(iconv.decode(bufferhelper, 'GBK'));
    //  });
    //});
    //
    //req.on('error', function (e) {
    //  reject(e.message);
    //  console.log('loadData error: ' + e.message);
    //});
    //req.end();
  });
};

//loadData('http://www.ithome.com/list/list_9999.html').then(function (data) {
//  var $ = cheerio.load(data, {
//    normalizeWhitespace: true,
//    //xmlMode: true,
//    decodeEntities: false
//  });
//  var pageAccount = parseInt($('.pagenew>span.current').text(), 10);

//1754页的评论中带有设备信息，之前设备信息全部为空
var pageAccount = 3;
var allHasCommentPage = 1754;
//var gen1 = function*() {

var gen2 = function() {

  var concurrencyCount = 0;
  var fetchUrl = function (url, callback) {
    concurrencyCount++;
    console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url);
    loadData('http://www.ithome.com/ithome/CommentCount.aspx?newsid=' + url).then(function (res) {
      concurrencyCount--;

      var hehe = res.match(commentExp)[0].substr(10);
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
      console.log(url + ' are complete!');
      fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n'+JSON.stringify(done) + '\n', {
        //flag: 'a'
      });
      callback(null, url);
    });
  };

  async.mapLimit(aidArr, maxConcurrent, function (url, callback) {
    fetchUrl(url, callback);
  }, function (err, result) {
    console.log('============= All complete =============');
    console.log(done);
  });
};




  var concurrencyCount1 = 0;
  var fetchUrl1 = function (url, callback) {
    concurrencyCount1++;
    console.log('现在的并发数是', concurrencyCount1, '，正在抓取的是', url);
    loadData('http://www.ithome.com/list/list_' + url + '.html').then(function (res) {
      concurrencyCount1--;

      var $ = cheerio.load(res, {
        normalizeWhitespace: true,
        //xmlMode: true,
        decodeEntities: false
      });
      $('.ulcl>li:not(.hr)>a').each(function (index, element) {
        var aid = $(element).attr('href').match(aidExp)[0].substr(1);
        aidArr.push(aid);
      });

      console.log(url + ' are complete!');
      callback(null, url);
    });
  };

  async.mapLimit([1, 2,3,4], maxConcurrent, function (url, callback) {
    fetchUrl1(url, callback);
  }, function (err, result) {
    console.log('============= All complete =============');
    console.log(aidArr);
    gen2();
  });


  //for (var i = 0; i < 2; i++) {
  //  var result = yield loadData('http://www.ithome.com/list/list_' + (i + 1) + '.html');
  //  var $ = cheerio.load(result, {
  //    normalizeWhitespace: true,
  //    //xmlMode: true,
  //    decodeEntities: false
  //  });
  //  $('.ulcl>li:not(.hr)>a').each(function (index, element) {
  //    var aid = $(element).attr('href').match(aidExp)[0].substr(1);
  //    aidArr.push(aid);
  //  });
  //}
//};

//co(gen1).then(function () {
//  var gen2 = function() {
//
//    var concurrencyCount = 0;
//    var fetchUrl = function (url, callback) {
//      concurrencyCount++;
//      console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url);
//      loadData('http://www.ithome.com/ithome/CommentCount.aspx?newsid=' + url).then(function (res) {
//        concurrencyCount--;
//
//        var hehe = res.match(commentExp)[0].substr(10);
//        var html = hehe.substring(0, hehe.length - 2);
//        var $ = cheerio.load(unescape(html));
//        $('#ulcommentlist>li').each(function (index, element) {
//          var hehehehe = $($(element).find('div.info.rmp')[0]).find('.mobile');
//          if (hehehehe.length) {
//            //var name = $(hehehehe).find('a').text();
//            var type = $(hehehehe).attr('class').substr(7);
//            var isExist = true;
//            $(done).each(function (index2, element2) {
//              if (element2.type === type) {
//                element2.sum++;
//                isExist = false;
//                return false;
//              }
//            });
//            if (isExist) {
//              done.push({
//                type: type,
//                sum: 1
//              });
//            }
//          } else {
//            done[0].sum++;
//          }
//        });
//        console.log(url + ' are complete!');
//        fs.writeFile(path.join(__dirname, 'log.log'), JSON.stringify(done) + '\n', {
//          //flag: 'a'
//        });
//        callback(null, url);
//      });
//    };
//
//    async.mapLimit(aidArr, maxConcurrent, function (url, callback) {
//      fetchUrl(url, callback);
//    }, function (err, result) {
//      console.log('============= All complete =============');
//      console.log(done);
//    });
//  };
  //co(gen2).then(function () {
  //  console.log(done);
  //}).catch(function (error) {
  //  console.log("gen2 error: " + error);
  //});
//}).catch(function (error) {
//  console.log("gen1 error: " + error);
//});
//});