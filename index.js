var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var telegramApi = require('./telegram')();


//express configuration
app.use(bodyParser.json());

//telegram connection
telegramApi.createConnection(process.env.TELEGRAM_TOKEN, process.env.DEBTMANAGERBOT_URL, (err) => {
  if(err) { throw "Unable to set webhook"}
  console.log('webhook to telegram set');
});

app.post('/', (req, res) => {
  console.log('recieved message');
  var message = req.body.message;
  telegramApi.sendMessage(message.from.id, message.text, [], (err) => {
    if(err) { console.error("error while sending message"); }
    return res.send();

  })

});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
