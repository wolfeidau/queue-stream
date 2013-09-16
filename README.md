# queue-stream [![Build Status](https://drone.io/github.com/wolfeidau/queue-stream/status.png)](https://drone.io/github.com/wolfeidau/queue-stream/latest)

[![NPM](https://nodei.co/npm/queue-stream.png)](https://nodei.co/npm/queue-stream/)
[![NPM](https://nodei.co/npm-dl/queue-stream.png)](https://nodei.co/npm/queue-stream/)

This module provides a simple stream interface to an AMQP message queue. The objective is to provide a small simple way
of consuming JSON based messages from a queue, with a way of dispatching events based on routing keys used in AMQP.

# Usage

This example is designed to be run from the command line as follows, it will output anything sent via the queue to
STDOUT.

```javascript
"use strict";

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
```

# TODO

* Add the option to just pass an AMQP URL.

## License
Copyright (c) 2013 Mark Wolfe
Licensed under the MIT license.