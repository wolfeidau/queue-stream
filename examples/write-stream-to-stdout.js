"use strict";
/*
 * This example is designed to be run from the command line as follows, it will output anything sent via the queue to
 * STDOUT.
 *
 * node examples/write-stream-to-stdout.js
 */

var es = require('event-stream');
var amqp = require('amqp');
var queueStream = require('../lib/queue-stream.js');
var log = require('debug')('write-stream-to-stdout');


var connection =
  amqp.createConnection({url: "amqp://guest:guest@localhost:5672"});

connection.on('ready', function () {
  log('Connection', 'open');

  queueStream({connection: connection, exchangeName: '/events/input', queueName: '/queue/input'}, function (err, qs) {
    log('topicStream', 'open');
    qs.bindRoutingKey('#', function(){
      log('bindRoutingKey', '#');
      es.pipeline(qs, es.through(function onData(data) {
        this.emit('data', data + '\n')
      }), process.stdout)

    })
  })
});
