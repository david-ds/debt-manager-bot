var moment = require('moment');

module.exports = (telegramApi) => {

  var response = {};
  var jokeAboutGroupName = "Camping 2016"

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
        text = "Ok, I got it " + name
    }
    text += "\n\nRemember : you type /newtransaction to create a new transaction";

    var keyboard = [["/newtransaction", "/transactions", "/balance"]];
    telegramApi.sendMessage(chat.id, text, {keyboard: keyboard, resize_keyboard: true}, callback);
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
    var text = "Sorry :/ I don't get it. Maybe I don't know this username or I don't recognize the amount. Please tell me the new creditors in the format '@pseudo 10.0'";
    telegramApi.sendMessage(chat.id, text, {"force_reply": true}, callback);
  }

  response.askForCreditor = (chat, transaction, callback) => {
    var text = "Ok, I get it. For now I have :\n";
    transaction.creditors.forEach((creditor) => {
      text += "@" + creditor.user.username + " paid " + creditor.amount + "€\n"
    });
    text += "Who else ? When you're done, say stop";

    var keyboard = [["stop"]];
    telegramApi.sendMessage(chat.id, text, {keyboard: keyboard, resize_keyboard: true}, callback);
  }

  response.askForFirstParticipant = (chat, callback) => {
    var text = "Alright. Now, who participated in ? You can tell me the names this way : \"@BarackObama @QueenElisabeth\" or anwser \"everybody\"";
    var keyboard = [["everybody"]];
    telegramApi.sendMessage(chat.id, text, {keyboard: keyboard, resize_keyboard: true}, callback);
  }

  response.everyoneHadParticipated = (chat, groupMembers, callback) => {
    var text = "Ok, I added ";
    groupMembers.forEach((member) => { text += "@" + member.username + ","});
    text = text.slice(0,-1) + ".";
    telegramApi.sendMessage(chat.id, text, {}, callback);
  }

  response.participantsAdded = (chat, transaction, callback) => {
    var text = "Ok. In my list I have ";
    transaction.participants.forEach((participant) => {text += "@" + participant.user.username + ", "});
    text = text.slice(0,-2) + ".\n";
    text += "Did I forgot anyone ? If no, say stop.";
    telegramApi.sendMessage(chat.id, text, {"force_reply": true}, callback);
  };

  response.transactionSummary = (chat, transaction, callback) => {
    var text = "Ok, I think I've got everything I need. Let's sum up this :\n"
    text += "@" + transaction.creator.username  + " created " + transaction.name + "\n";
    text += "\nThe creditors are :\n";
    var totalAmount = 0;
    transaction.creditors.forEach((creditor) => {
      text += "@" + creditor.user.username + " (" + creditor.amount + "€)\n";
      totalAmount += creditor.amount});

    text += "\nThe participants are :\n";
    transaction.participants.forEach((participant) => {
      text += "@" + participant.user.username + "\n";
    });
    text += "\n";
    text += "Do you confirm it ?";


    var keyboard = [["Yes", "No"]];

    telegramApi.sendMessage(chat.id, text, {keyboard: keyboard, "one_time_keyboard": true, resize_keyboard: true}, callback);
  };


  response.endTransaction = (chat, callback) => {
    var keyboard = [["/newtransaction", "/transactions", "/balance"]];

    telegramApi.sendMessage(chat.id, "Ok, well done ! Type /balance to pay your debts or /transactions to see the last transactions", {keyboard: keyboard, resize_keyboard: true}, callback);
  }

  response.problemTransaction = (chat, callback) => {
    var keyboard = [["Yes"]];
    telegramApi.sendMessage(chat.id, "Well... That's a problem because I can't edit a transaction for now.. Please say Yes", {keyboard: keyboard, resize_keyboard: true}, callback);
  }


  response.sendTransactions = (chat, transactions, callback) => {

    var text = "List of the last transactions :\n\n";
    if (transactions.length === 0) {
      text = "No transactions for the moment :/";
    }
    else {
      transactions.forEach((transaction) => {
        var totalAmount = 0;
        transaction.creditors.forEach((creditor) => {totalAmount += creditor.amount});
        text += moment(transaction.createdAt).format('ddd DD MMM');
        text += " | " + transaction.name + " created by @" + transaction.creator.username  + " | " + totalAmount + "€";
        text += " | /show" + transaction._id;
        text += "\n";
      });
    }
    var keyboard = [["/newtransaction", "/transactions", "/balance"]];

    telegramApi.sendMessage(chat.id, text, {keyboard: keyboard, resize_keyboard: true}, callback);
  }

  response.sendBalance = (chat, balance, situations, callback) => {
    var text = "First, where are we ?\n\n";
    situations.forEach((situation) => {
      text += "@" + situation.user.username + " " + situation.amount + "€\n"
    });
    text += "\nHow to solve it ?\n";
    if(balance.length === 0) {
      text = "You have nothing to do, everything is ok !";
    } else {
      balance.forEach((operation) => {
        text += "@" + operation.from.username  + " give " + operation.amount + "€ to @" + operation.to.username;
        text += "\n";
      });
    }
    var keyboard = [["/newtransaction", "/transactions", "/balance"]];

    telegramApi.sendMessage(chat.id, text, {keyboard: keyboard, resize_keyboard: true}, callback);
  }


  response.showTransaction = (chat, transaction, callback) => {
    var text = transaction.name + " created by @" + transaction.creator.username + " on " + moment(transaction.createdAt).format('DD MM YYY');
    text += "\n\nWho paid ?\n";
    transaction.creditors.forEach((creditor) => {
      text += "@" + creditor.user.username  + " : " + creditor.amount + "€";
      text += "\n";
    });

    text += "\nWho participated in ?\n";
    transaction.participants.forEach((participant) => {
      text += "@" + participant.user.username + "\n";
    });
    telegramApi.sendMessage(chat.id, text, {}, callback);
  }
  return response;


}
