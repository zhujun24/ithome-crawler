exports.Param = {
  findId: '563432cfc110a69776985d3a',
  year: "2015",
  server: {
    serverTest: ['192.168.1.4:27017'],
    serverDev: ['127.0.0.1:23333'],
    serverProduction: ['192.168.1.9:27017', '192.168.1.8:27017', '192.168.1.5:27017', '192.168.1.10:27017']
  },
  db: {
    name: 'video',
    collections: [
      'zongyi_list',
      'zongyi'
    ]
  },
  vidMatch: /\d+/,
  cztvVideoUrl: 'http://api.cms.cztv.com/mms/out/album/videos?id=785&cid=11&platform=pc',
  urlTemplatePrefix: 'http://video.browser.tvall.cn/yunpan/paonan3_',
  urlTemplateInfix: '?name=%E5%A5%94%E8%B7%91%E5%90%A7%E5%85%84%E5%BC%9F%E7%AC%AC3%E5%AD%A3&source=haoshengyin&apiUrl=',
  base64UrlPrefix: 'http://api.cms.cztv.com/mms/out/video/playJson?id=',
  base64UrlInfix: '&platid=111&splatid=1002&format=1&tkey=1448340158908&domain=m.tv.cztv.com&pt=4&at=1',





  indexPage: ['http://www.ithome.com/list/list_1.html','http://www.ithome.com/list/list_2.html']
};