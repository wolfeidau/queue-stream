"use strict";

var chai = require('chai');

var log = require('debug')('test:queue-stream');
var amqplib = require('amqplib');
var through = require('through2');

var queueStream = require('../lib/queue-stream.js');

var expect = chai.expect;

var params = {durable: true, autoDelete: false, messageTtl: 30000, expires: 1800000};

describe('QueueStream', function () {

  it('should create a new queue stream', function (done) {

    log('Connection', 'open');

    var open = amqplib.connect();

    queueStream(open, {exchange: '/test/events', queue: '/queue/events/234', params: params}, function (err, stream) {
      expect(err).to.not.exist;
      expect(stream).to.exist;
      stream.end();
      done();
    });

  });

  it('should read data from the queue stream', function (done) {


    log('Connection', 'open');

    var open = amqplib.connect();

    queueStream(open, {exchange: '/test/events2', queue: '/queue/events/123', params: params}, function (err, stream) {
      expect(err).to.not.exist;
      expect(stream).to.exist;
      stream.bindRoutingKey('TEST', function () {
        log('bound')
      });

      stream.pipe(through({ objectMode: true }, function (chunk, enc, callback) {
        callback();
      }));

      var msgs = [];

      stream.on('data', function (data) {
        log('data', data);
        msgs.push(data);
        if(msgs.length == 4)
          done();
      });

      open.then(function (conn) {
        var ok = conn.createChannel();
        ok = ok.then(function (ch) {
          log('publish');
          ch.publish('/test/events2', 'TEST', new Buffer(JSON.stringify({msg: 'test'})));
          ch.publish('/test/events2', 'TEST', new Buffer(JSON.stringify({msg: 'test'})));
          ch.publish('/test/events2', 'TEST', new Buffer(JSON.stringify({msg: 'test'})));
          ch.publish('/test/events2', 'TEST', new Buffer(JSON.stringify({msg: 'test'})));
          log('done');
          //stream.end();
        });

        return ok;
      });


    });

  })

})