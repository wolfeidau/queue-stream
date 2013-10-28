"use strict";
/*
 * queue-stream
 * https://github.com/wolfeidau/queue-stream
 *
 * Copyright (c) 2013 Mark Wolfe
 * Licensed under the MIT license.
 */
var log = require('debug')('queue-stream');
var when = require('when');
var crypto = require('crypto');
var through = require('through2');

module.exports = function (open, options, cb) {

  var exchangeName = options.exchange;

  var params = options.params || {};
  var onError = options.onError || function (err) {
    console.warn('queue-stream', err)
  };

  if (!options.queue) {
    cb(new Error('Missing queueName.'));
    return;
  }
  var queueName = options.queue;

  log('exchangeName', exchangeName);

  var stream = through({ objectMode: true });

  function handleMessage(ch, msg) {
    var obj = JSON.parse(msg.content);
    log('obj', obj);
    stream.write(obj);
    ch.ack(msg);
  }

  function _consumerTagGenerator () {
    return crypto.randomBytes(5).readUInt32BE(0).toString(16);
  }

  open.then(function (conn) {

    log('connection', 'open');

    var ok = conn.createChannel();

    // clean up on close
    stream.on('end', function(){
      log('conn', 'close');
      conn.close();
    });

    ok = ok.then(function (ch) {

      log('channel', 'open');

      var consumerTag = _consumerTagGenerator();

      when.all([
          ch.assertQueue(queueName, params),
          ch.assertExchange(exchangeName, 'topic'),
          ch.consume(queueName, handleMessage.bind(null, ch),{consumerTag: consumerTag})
        ]).then(function () {

          // this method enables binding of keys
          stream.bindRoutingKey = function (key, bcb) {
            log('bindRoutingKey', exchangeName, queueName, key);
            ch.bindQueue(queueName, exchangeName, key);
            bcb && bcb(null);
          };

          // this method enables canceling of a consumer
          stream.cancelConsumer = function () {
            return ch.cancel(consumerTag); // close that consumer
          };
          cb(null, stream);
        }, onError);

    }, onError);

    return ok;

  }, onError)

};
