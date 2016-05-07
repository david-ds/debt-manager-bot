

module.exports = (telegramApi) => {

  var response = {};
  var jokeAboutGroupName = "One Direction Fans"

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
    text += "Oooh, and what if you give a name to this group ? \n"
    text += "For example.. Let me guess.. " + jokeAboutGroupName

    telegramApi.sendMessage(to.id, text, {"force_reply": true}, callback);
  }

  response.renamedGroup = (chat, name, callback) => {
    var text = "";
    if(name === jokeAboutGroupName) {
      text = "Oh you listen to me <3 Your name is now " + jokeAboutGroupName;
    }
    else {
        text = "Ok, you're not really fun.. I will call you " + name
    }
    text += "\n\nRemember : you type /newtransaction to create a new transaction";
    telegramApi.sendMessage(chat.id, text, {}, callback);
  };

  response.createdEmptyTransaction = (chat, callback) => {
    var text = "Yesss ! I'm on it. First, give the transaction a name. Something like \"pizzas\"";
    telegramApi.sendMessage(chat.id, text, {"force_reply": true}, callback);
  }

  response.askForFirstCreditor = (chat, transactionName, callback) => {
    var text = "Alright. Who paid for " + transactionName + " ?\n";
    text += "Type for example : @BarackObama 5.0";
    telegramApi.sendMessage(chat.id, text, {"force_reply": true}, callback);
  }

  response.sayInvalidCreditor = (chat, callback) => {
    var text = "Sorry :/ I don't get it. Please tell me the new creditors in the format '@pseudo 10.0'";
    telegramApi.sendMessage(chat.id, text, {"force_reply": true}, callback);
  }

  response.askForCreditor = (chat, transaction, callback) => {
    var text = "Ok, I get it. For now I have :\n";
    transaction.creditors.forEach((creditor) => {
      text += creditor.user.firstName + " paid " + creditor.amount + "€\n"
    });
    text += "Who else ? When you're done, say stop";

    telegramApi.sendMessage(chat.id, text, {"force_reply": true}, callback);
  }

  response.askForFirstParticipant = (chat, callback) => {
    var text = "Alright. Now, who participated in ? You can tell me the names this way : @BarackObama @QueenElisabeth or anwser \"everybody\"";
    telegramApi.sendMessage(chat.id, text, {"force_reply": true}, callback);
  }

  return response;
}
