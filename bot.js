

module.exports = (telegramApi) => {

  var response = {};

  response.sayHello = function(to, callback) {
    var text = "Hello There ! Nice to meet you " + to.first_name + ".\n";
    text += "I'm DebtManagerBot. I will help you manage your finance with your friends.\n";
    text += "I will try to remember you for the next time. It' ok ?";

    var answers = [[{text: 'Yes'}, {text:'No'}]];
    telegramApi.sendMessage(to.id, text, {'keyboard': answers, 'one_time_keyboard': true}, callback);
  }

  return response;
}
