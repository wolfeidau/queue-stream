"use strict";

var chai = require('chai');

var log = require('debug')('test:queue-stream');
var amqp = require('amqp');
var through = require('through');

var queueStream = require('../lib/queue-stream.js');

var expect = chai.expect;

describe('QueueStream', function () {

  it('should create a new queue stream', function (done) {

    var connection =
      amqp.createConnection({url: "amqp://guest:guest@localhost:5672"})

    connection.on('ready', function () {
      log('Connection', 'open')

      queueStream({connection: connection, exchangeName: '/test/events', queueName: '/queue/events'}, function (err, stream) {
        expect(err).to.not.exist
        expect(stream).to.exist
        stream.end()
        done()
      })
    })

  })

  it('should read data from the queue stream', function (done) {

    function sendData(connection, text) {
      connection.exchange('/test/events/2', {type: 'topic'}, function (ex) {
        log('Exchange', ex.name, 'open')
        ex.publish('TEST', JSON.stringify({text: text}), {contentEncoding: 'utf8', contentType: 'application/json'});
      })
    }

    var connection =
      amqp.createConnection({url: "amqp://guest:guest@localhost:5672"})

    connection.on('ready', function () {
      log('Connection', 'open')

      queueStream({connection: connection, exchangeName: '/test/events/2', queueName: '/queue/events'}, function (err, stream) {
        expect(err).to.not.exist
        expect(stream).to.exist

        stream.bindRoutingKey('#', function(){

          stream.pipe(through(function onData(message){
            log('onData', message)
            expect(message.text).is.equal('Hello Test');
            stream.end()
            done()
          }))

          sendData(connection, 'Hello Test');
        })


      })
    })

  })
})