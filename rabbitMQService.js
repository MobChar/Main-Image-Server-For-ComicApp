module.exports = new Promise(function(resolve, reject){
    var amqp = require('amqplib/callback_api');
    amqp.connect('amqp://htrlpkhz:vmQjT9RfCPnVmnrRcjzG1ULysTMw6nQj@mustang.rmq.cloudamqp.com/htrlpkhz', function (error0, connection) {

        connection.createChannel(function (error1, channel) {
            if (error1) {
                reject(error1);
            }
            resolve(channel);
        });
    });
});


