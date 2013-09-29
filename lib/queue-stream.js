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
var through = require('through2');

module.exports = function (open, options, cb) {

  var exchangeName = options.exchange;

  var params = options.params || {};
  var onError = options.onError || function(err){console.warn('queue-stream', err)};

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

  open.then(function(conn) {

    log('connection', 'open');

    var ok = conn.createChannel();

    ok = ok.then(function(ch) {

      log('channel', 'open');

      when.all([
        ch.assertQueue(queueName, params),
        ch.assertExchange(exchangeName, 'topic'),
        ch.consume(queueName, handleMessage.bind(null, ch))
      ]).then(function(){
          log('bindRoutingKey');
          stream.bindRoutingKey = function (key, bcb) {
            log('bindRoutingKey', exchangeName, queueName, key);
            ch.bindQueue(queueName, exchangeName, key);
            bcb && bcb(null);
          };
          cb(null, stream);
        }, onError);
    }, onError);

    return ok;

  }, onError)

};
