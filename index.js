var co = require('co');
var config = require('./config').Param;
var request = require('request');
var mongo = require('mongodb');
var fs = require('fs');
var path = require('path');

var pinBase64Url = function(vid) {
  return new Buffer(config.base64UrlPrefix + vid + config.base64UrlInfix).toString('base64');
};

var GetDateStr = function(AddDayCount) {
  var dd = new Date();
  dd.setDate(dd.getDate() + AddDayCount);
  var y = dd.getFullYear();
  var m = dd.getMonth() + 1;
  m = m > 9 ? m : '0' + m;
  var d = dd.getDate();
  d = d > 9 ? d : '0' + d;
  return y + '' + m + '' + d;
};

request(config.baiduVideoUrl, function(error, response, body) {
  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body)[0].episodes;
    var catchDataLength = data.length; //抓取百度的跑男节目期数

    request(config.cztvVideoUrl, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var cztvData = JSON.parse(body).data.reverse();
        var catchCZTVDataLength = cztvData.length; //抓取CZTV的跑男节目期数
        var isMore = catchCZTVDataLength - catchDataLength; //新蓝多于百度
        if (isMore) {
          for (var i = 0; i < isMore; i++) {
            var newData = cztvData[isMore - i - 1];
            var hehe = {
              "single_title": newData.title,
              "url": newData.url,
              "episode": GetDateStr(-1),
              "is_play": "1",
              "site_order": "2",
              "site_url": "cztv.com",
              "thumbnail": newData.pic,
              "thumbnail_16_9": newData.pic,
              "guest": [],
              "swfurl": null
            };
            data.unshift(hehe);
          }
        }
      } else {
        console.log('CZTV API ERROR: ' + error);
        fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + 'CZTV API ERROR: ' + error + '\n\n', {
          flag: 'a'
        });
      }

      var mc = mongo.MongoClient;
      // process.env.NODE_ENV = 'production';
      var env = process.env.NODE_ENV || null;
      var hostArray = [];
      switch (env) {
        case 'test':
          hostArray = config.server.serverTest
          break;
        case 'dev_local':
          hostArray = config.server.serverDev
          break;
        case 'production':
          hostArray = config.server.serverProduction
          break;
        default:
          hostArray = config.server.serverDev
      }
      var DBUrl = 'mongodb://' + hostArray.join(',') + '/' + config.db.name;
      if (env === 'production') {
        DBUrl += '?w=4&readPreference=secondary'
      }

      mc.connect(DBUrl, function(err, db) {
        if (err) {
          console.log('DB Connect ERROR: ' + err);
          fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + 'DB Connect ERROR: ' + err + '\n\n', {
            flag: 'a'
          });
        } else {
          db.collection(config.db.collections[0], function(err, collection) {
            collection.find({
              _id: mongo.ObjectId(config.findId)
            }).toArray(function(error, response) {
              var DB = response[0].videourl;
              var DBLength = DB[0].vurl.length;
              var newLength = data.length;
              if (DBLength === newLength) { //比对数据库和抓取的数据
                db.close();
                console.log('=============数据已同步,不用更新=============');
                fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + '数据已同步,不用更新' + '\n\n', {
                  flag: 'a'
                });
              } else { //抓取的数据多于数据库,向数据库追加更新数据
                var updateArray = [];
                var gen = function*() {
                  var insertLength = newLength - DBLength;
                  for (var i = 0; i < insertLength; i++) {
                    var item = data[i];
                    var result = yield loadData(item);
                    var vid = result.toString().match(config.vidMatch)[0]; //视频的vid
                    item.url = config.urlTemplatePrefix + (newLength - i) + config.urlTemplateInfix + pinBase64Url(vid);
                    updateArray.push(item);

                    if (i == insertLength - 1) {
                      //更新数组拼接完成,准备写入数据库
                      var lastUpdate = data[0].episode;
                      var updateDate = '更新至' + lastUpdate.substr(0, 4) + '-' + lastUpdate.substr(4, 2) + '-' + lastUpdate.substr(6, 2);
                      //更新zongyi_list
                      collection.update({
                        _id: mongo.ObjectId(config.findId),
                        "videourl.year": config.year
                      }, {
                        $set: {
                          'videourl.0.vurl': updateArray.concat(DB[0].vurl),
                          'update': updateDate,
                          'tag': lastUpdate
                        }
                      });

                      //更新zongyi
                      db.collection(config.db.collections[1], function(err, col) {
                        col.update({
                          _id: mongo.ObjectId(config.findId)
                        }, {
                          $set: {
                            'update': updateDate,
                            'tag': lastUpdate,
                            'hot': 1,
                            'pubtime': 1
                          }
                        });
                      });
                      db.close();
                      console.log('===============更新了 ' + insertLength + ' 条数据===============');
                      fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + '更新了 ' + insertLength + ' 条数据' + '\n\n', {
                        flag: 'a'
                      });
                    }
                  }
                };

                var loadData = function(item) {
                  if (item.url.indexOf('http://tv.cztv.com/vplay/') === -1) {
                    item.url = config.baiduVideoPrefix + item.url;
                  }
                  return new Promise(function(resolve, reject) {
                    request(item.url, function(error, response, body) {
                      if (!error && response.statusCode === 200) {
                        resolve(body);
                      } else {
                        reject(error);
                      }
                    });
                  });
                };

                co(gen).then(function() {
                  //console.log('Generator 函数执行完成');
                }).catch(function(error) {
                  console.log(error);
                  fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + error + '\n\n', {
                    flag: 'a'
                  });
                });
              }
            });
          });
        };
      });
    });
  } else {
    console.log('Baidu API ERROR: ' + error);
    fs.writeFile(path.join(__dirname, 'log.log'), new Date() + '\n' + 'Baidu API ERROR: ' + error + '\n\n', {
      flag: 'a'
    });
  }
});