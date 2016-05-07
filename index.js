var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var telegramApi = require('./telegram')();

var bot = require('./bot')(telegramApi);


//express configuration
app.use(bodyParser.json());

//telegram connection
telegramApi.createConnection(process.env.TELEGRAM_TOKEN, process.env.DEBTMANAGERBOT_URL, (err) => {
  if(err) { throw "Unable to set webhook"}
  console.log('webhook to telegram set');
});

app.post('/', (req, res) => {
  var message = req.body.message;
  console.log('recieved message : ' + message.text);


  if(message.text == "/start") {
    bot.sayHello(message.from, (err) => {
      if(err) { console.error('cannot say hello');}
      return res.send();
    });
  }

  else {
    return res.send();
  }

});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
