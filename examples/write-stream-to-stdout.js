"use strict";
/*
 * This example is designed to be run from the command line as follows, it will output anything sent via the queue to
 * STDOUT.
 *
 * node examples/write-stream-to-stdout.js
 */

var es = require('event-stream');
var amqplib = require('amqplib');
var queueStream = require('../lib/queue-stream.js');
var log = require('debug')('write-stream-to-stdout');


var open =
  amqplib.connect();

var queueParams = {"durable": true};

queueStream(open, {exchangeName: 'events/syslog', queueName: 'queue/input', params: queueParams}, function (err, qs) {
  log('topicStream', 'open');
  qs.bindRoutingKey('#', function () {
    log('bindRoutingKey', '#');
    es.pipeline(qs, es.through(function onData(data) {
      this.emit('data', data + '\n')
    }), process.stdout);

  });
});
