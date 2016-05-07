var request = require('request');

var telegramApiEndpoint = "https://api.telegram.org/bot"

module.exports = () => {
  this.telegramApi = "";

  this.sendRequest = (method, data, callback) => {
    request.post({url: this.telegramApi + "/" + method, body: data, json:true}, callback);
  }

  var response = {};
  response.createConnection = (token, urlWebhook, callback) => {
    //check if token is set:
    if(!token) { throw "You must provide a telegram bot token"};
    if(!urlWebhook) { throw "You must provide a webhook url"};

    this.telegramApi = telegramApiEndpoint + token;
    var data = {url: urlWebhook};
    this.sendRequest('setWebhook', data, (err, response, body) => {
      callback(err);
    });
  };

  return response;
}
