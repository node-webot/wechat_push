var crypto = require('crypto');
var urllib = require('urllib');

var md5 = function (input) {
  var hash = crypto.createHash('md5');
  return hash.update(input).digest("hex");
};

var PREFIX = 'https://mp.weixin.qq.com/cgi-bin/';

var Pusher = function (username, password) {
  // 用户ID
  this.username = username;
  // 用户密码
  this.password = password;
  // 用户Cookie
  this.cookie = null;
  this.token = '';
};

Pusher.prototype.login = function (callback) {
  var that = this;
  var submitUrl = PREFIX + 'login?lang=zh_CN';

  var data = {
    username: this.username,
    pwd: md5(this.password),
    f: 'json'
  };

  var options = {
    data: data,
    type: 'POST',
    dataType: 'json',
    headers: {
      'Referer': PREFIX + 'loginpage?t=wxm2-login&lang=zh_CN',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36'
    }
  };

  urllib.request(submitUrl, options, function (err, body, res) {
    if (err) {
      return callback(err);
    }
    var fields = res.headers['set-cookie'];
    fields = Array.isArray(fields) ? fields : [fields];
    var cookies = fields.map(function (item) {
      return item.replace('Path=/; Secure; HttpOnly', '').replace(';', '').trim();
    });
    // record the cookie
    that.cookie = cookies.join('; ');
    var token = body.ErrMsg.match(/token=(\d*)/);
    // record the token
    that.token = token[1];
    callback(null);
  });
};

Pusher.prototype.send = function (fakeId, content, callback) {
  var token = this.token;
  var data = {
    'tofakeid': fakeId,
    'type': 1,
    'content': content,
    'error': 'false',
    'imgcode': '',
    'token': token,
    'ajax': 1
  };

  var options = {
    headers: {
      'Referer': PREFIX + 'singlemsgpage?token=' + token + '&fromfakeid=' + fakeId + '&msgid=&source=&count=20&t=wxm-singlechat&lang=zh_CN',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36',
      'Cookie': this.cookie
    },
    type: 'POST',
    dataType: 'json',
    data: data
  };

  var url = PREFIX + 'singlesend?t=ajax-response&lang=zh_CN';
  urllib.request(url, options, function (err, body, res) {
    if (err) {
      return callback(err);
    }
    if (body.ret !== '0') {
      var e = new Error(body.msg);
      e.name = 'WechatPushError';
      return callback(e);
    }
    callback(err, body);
  });
};

Pusher.prototype.getAvatar = function (fakeId) {
  return PREFIX + 'getheadimg?token=' + this.token + '&fakeid=' + fakeId;
};

module.exports = Pusher;
