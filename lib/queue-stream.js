"use strict";
/*
 * queue-stream
 * https://github.com/wolfeidau/queue-stream
 *
 * Copyright (c) 2013 Mark Wolfe
 * Licensed under the MIT license.
 */
var log = require('debug')('queue-stream');
var through = require('through2');

module.exports = function (options, cb) {

  var connection = options.connection;
  var exchangeName = options.exchangeName;
  var params = options.params || {};

  if (!options.queueName) {
    cb(new Error('Missing queueName.'));
    return;
  }
  var queueName = options.queueName;

  log('exchangeName', exchangeName);

  log('connection', 'open');

  connection.on('error', function (err) {
    console.warn('error opening queue-stream', err);
  })

  // we are assuming your using a topic exchange
  // this essentially means messages are load balanced across
  // the connected queues.
  connection.exchange(exchangeName, {}, function (exchange) {
    log('Exchange', exchange.name, 'open');

    var stream = through({ objectMode: true, highWaterMark: 1});

    log('Queue', queueName, params);
    var q = connection.queue(queueName, params, function (queue) {

      log('Queue', queue.name, 'open', params);

      stream.bindRoutingKey = function (key, bcb) {
        log('bindRoutingKey', exchange.name, queue.name, key);
        queue.bind(exchange, key);
        bcb && bcb(null);
      }

      log('Queue', queue.name, 'subscribe');

      queue.subscribe(function (message, headers, deliveryInfo) {
        log('message', 'routingKey', deliveryInfo.routingKey, stream.writable);
        if (stream.writable === true) {
          stream.push(message);
          queue.shift();
        }
      });

      cb(null, stream);

    });

    stream.on('end', function () {
      log('Exchange', exchange.name, 'close');
      exchange.close();
      log('Queue', q.name, 'close');
      q.close();
    });

  });

};
