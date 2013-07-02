var Pusher = require('../');
var should = require('should');
var username = 'YOUR_USERNAME';
var password = 'YOUR_PASSWORD';

describe('push', function () {
  describe('new', function () {
    it('should ok', function () {
      var pusher = new Pusher(username, password);
      pusher.username.should.ok;
      pusher.password.should.ok;
    });
  });

  describe('login', function () {
    it('should ok', function (done) {
      var pusher = new Pusher(username, password);
      pusher.login(function (err, cookie) {
        should.not.exist(err);
        pusher.cookie.should.have.length(249);
        pusher.token.should.match(/\d{10}/);
        done();
      });
    });
  });

  describe('send', function () {
    it('should ok', function (done) {
      var pusher = new Pusher(username, password);
      pusher.login(function (err) {
        should.not.exist(err);
        pusher.send('604347680', '搞定push', function (err, data) {
          should.not.exist(err);
          data.ret.should.equal('0');
          data.msg.should.equal('ok');
          done();
        });
      });
    });
  });
});
