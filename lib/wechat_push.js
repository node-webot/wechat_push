var crypto = require('crypto');
var urllib = require('urllib');

var md5 = function (input) {
  var hash = crypto.createHash('md5');
  return hash.update(input).digest("hex");
};

var PREFIX = 'http://admin.wechat.com/cgi-bin/';

var Pusher = function (username, password) {
  if (typeof username === 'object') {
    var account = username;
    username = account.username;
    password = account.password;
  }
  // 用户ID
  this.username = username;
  // 用户密码
  this.password = password;
  // 用户Cookie
  this.cookie = null;
  this.token = '';

  this.headers = { 
    'Host': 'admin.wechat.com',
    'Connection': 'keep-alive',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Origin': 'http://admin.wechat.com',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Referer': 'Referer: http://admin.wechat.com/cgi-bin/loginpage?t=wxm2-login&lang=en_US',
    'Accept-Encoding': 'gzip,deflate,sdch',
    'Accept-Language': 'zh-CN,zh;q=0.8',
    'Cookie': cookie_gen()
  };
};

Pusher.prototype.login = function (verify, callback) {  // verify = {code: code, cookie: cookie}
  var that = this;
  var submitUrl = PREFIX + 'login?lang=en_US';
  var headers = this.headers;

  if (typeof verify === 'function') {  // no verify
    callback = verify;
    verify = '';
  } else {
    headers.Cookie = setCookie(headers.Cookie, verify.cookie);
    verify.cookie = null;  // free memory
    verify = verify.code;
  }

  var data = {
    username: this.username,
    pwd: md5(this.password),
    imgcode: verify,
    f: 'json'
  };

  var options = {
    data: data,
    type: 'POST',
    dataType: 'json',
    headers: headers,
    followRedirect: true,
    timeout: 20000
  };

  urllib.request(submitUrl, options, function (err, body, res) {
    if (err) {
      return callback(err);
    }
    var fields = res.headers['set-cookie'];
    if (fields) {
      fields = Array.isArray(fields) ? fields : [fields];
      var cookies = fields.map(function (item) {
        return item.replace('Path=/', '').replace(';', '').trim();
      });
      // record the cookie
      that.cookie = setCookie(that.headers.Cookie, cookies.join(';'));
      var token = body.ErrMsg.match(/token=(\d*)/);
      // record the token
      that.token = token[1];
      callback(null);
    }
    else if (body.ErrCode === -6) {  // verify code
      body.verifyImgSrc = PREFIX + 'verifycode?username=' + that.username + "&r=" + (new Date()) * 1;
      that.err = body;
      callback(null, body);
    }
    else {
      var e = new Error('Wechat Login Error:' + JSON.stringify(body));
      callback(e);
    }
  });
};

Pusher.prototype.send = function (fakeId, content, callback) {
  var token = this.token;
  var data = {
    'tofakeid': fakeId,
    'type': 1,
    'content': content,
    'error': 'false',
    'token': token,
    'ajax': 1
  };

  var headers = this.headers;
  headers.Cookie = this.cookie;
  headers.Referer = 'http://admin.wechat.com/cgi-bin/singlemsgpage?token=' + token + '&fromfakeid=177366&msgid=&source=&count=20&t=wxm-singlechat&lang=en_US';
  var options = {
    headers: headers,
    type: 'POST',
    dataType: 'json',
    data: data,
    timeout: 20000
  };

  var url = PREFIX + 'singlesend?t=ajax-response&lang=en_US';
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

Pusher.prototype.getAvatar = function (fakeId, callback) {
  var url = PREFIX + 'getheadimg?token=' + this.token + '&fakeid=' + fakeId;
  urllib.request(url, function (err, data, res) {
    if (err) {
      callback(err);
    } else {
      callback(null, data);
    }
  });
};

module.exports = Pusher;


function cookie_gen() {
  var now = new Date();
  var nowMs = now.getUTCMilliseconds() + 1;

  var pgv_pvid = (Math.round(Math.random() * 2147483647) * nowMs) % 10000000000;
  var pgv_info = 'ssid=s' + pgv_pvid;
  return 'pgv_pvid=' + pgv_pvid + '; pgv_info=' + pgv_info;
}

function setCookie(raw, toSet){
  toSet = toSet.split(';');
  var one = toSet.pop();
  var ret = raw.split(';').filter(function(c){ // delete if key exists 
    return (c.split('=')[0] != one.split('=')[0])
  });
  ret = one + ';' + ret.join(';');
  if (toSet.length > 0) {  // recur
    return setCookie(ret, toSet.join(';'));
  }
  return ret;
}
