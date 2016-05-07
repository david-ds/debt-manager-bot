

module.exports = (telegramApi) => {

  var response = {};

  response.sayHello = function(to, callback) {
    var text = "Hello There ! Nice to meet you " + to.first_name + ".\n";
    text += "I'm DebtManagerBot. I will help you manage your finance with your friends.\n";
    text += "I am sorry but I can talk to you personally for the moment :'( you have to invite me in a channel.\n";
    text += "See you soon !";

    telegramApi.sendMessage(to.id, text, {}, callback);
  }

  response.sayHelloToChannel = function(to, callback) {
    var text = "Hello There ! Nice to meet you everybody !\n"
    text += "I'm DebtManagerBot. I will help you manage your finance in this group.\n";
    text += "I will register you all as soon as you speak here.\n"
    text += "So, who's the first ?\n"
    text += "Oooh, and what if you give a name to this group ? Use the /rename command.\n"
    text += "For example.. /rename camping 2016"

    telegramApi.sendMessage(to.id, text, {}, callback);
  }

  return response;
}
