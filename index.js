var co = require('co');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var http = require('http');
var BufferHelper = require('bufferhelper');

var aidExp = /\/\d+/;
var commentExp = /unescape\('.*/;

var aidArr = [];
var done = [{
  type: '',
  sum: 0
}];

var loadData = function (url) {
  return new Promise(function (resolve, reject) {
    var req = http.request(url, function (res) {
      var bufferHelper = new BufferHelper();
      res.on('data', function (chunk) {
        bufferHelper.concat(chunk);
      });
      res.on('end', function () {
        var bufferhelper = bufferHelper.toBuffer();
        resolve(iconv.decode(bufferhelper, 'GBK'));
      });
    });

    req.on('error', function (e) {
      reject(e.message);
      console.log('loadData error: ' + e.message);
    });
    req.end();
  });
};

loadData('http://www.ithome.com/list/list_9999.html').then(function (data) {
  var $ = cheerio.load(data, {
    normalizeWhitespace: true,
    //xmlMode: true,
    decodeEntities: false
  });
  var pageAccount = parseInt($('.pagenew>span.current').text(), 10);
  var gen1 = function*() {
    for (var i = 0; i < pageAccount; i++) {
      var result = yield loadData('http://www.ithome.com/list/list_' + (i + 1) + '.html');
      var $ = cheerio.load(result, {
        normalizeWhitespace: true,
        //xmlMode: true,
        decodeEntities: false
      });
      $('.ulcl>li:not(.hr)>a').each(function (index, element) {
        var aid = $(element).attr('href').match(aidExp)[0].substr(1);
        aidArr.push(aid);
      });
    }
  };

  co(gen1).then(function () {
    var gen2 = function*() {
      for (var i = 0; i < aidArr.length; i++) {
        var result = yield loadData('http://www.ithome.com/ithome/CommentCount.aspx?newsid=' + aidArr[i]);
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
      }
    };
    co(gen2).then(function () {
      console.log(done);
    }).catch(function (error) {
      console.log("gen2 error: " + error);
    });
  }).catch(function (error) {
    console.log("gen1 error: " + error);
  });
});