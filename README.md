Wechat Push
=============
使用方式如下：

```
var Pusher = require('wechat_push');

var pusher = new Pusher(username, password);
pusher.login(function (err) {
  // send的第一个参数为fakeId，请自行搞定
  pusher.send('604347680', '搞定push', function (err, data) {
  	// 发送完成
    done();
  });
});
```

## 注意
由于微信方面没有公开相关API，不能保证本模块能永远正常工作。

## License
The MIT License
