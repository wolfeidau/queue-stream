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

  var exchangeName = options.exchangeName;

  var params = options.params || {};

  if (!options.queueName) {
    cb(new Error('Missing queueName.'));
    return;
  }
  var queueName = options.queueName;

  log('exchangeName', exchangeName);

  log('connection', 'open');

  var stream = through({ objectMode: true });

  function handleMessage(ch, msg) {
    var obj = JSON.parse(msg.content);
    log('obj', obj);
    stream.write(obj);
    ch.ack(msg);
  }

  open.then(function(conn) {

    var ok = conn.createChannel();

    ok = ok.then(function(ch) {

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
        });
    });

    return ok;

  })

};
