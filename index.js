var express = require('express');
var app = express();

var telegramApi = require('./telegram')();

//telegram connection
telegramApi.createConnection(process.env.TELEGRAM_TOKEN, process.env.DEBTMANAGERBOT_URL, (err) => {
  if(err) { throw "Unable to set webhook"}
  console.log('webhook to telegram set');
});

app.get('/', (req, res) => {
  return res.send('hello');
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
