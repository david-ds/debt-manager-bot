var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var telegramApi = require('./telegram')();

var bot = require('./bot')(telegramApi);

var users = require('./users')();
var transactions = require('./transactions')();


//express configuration
app.use(bodyParser.json());

//telegram connection
telegramApi.createConnection(process.env.TELEGRAM_TOKEN, process.env.DEBTMANAGERBOT_URL, (err) => {
  if(err) { throw "Unable to set webhook"}
  console.log('webhook to telegram set');
});

app.post('/', (req, res) => {
  var message = req.body.message;
  if(!message.text)  {
    return res.send();
  }
  console.log('recieved message : ' + message.text);

  var privateMessage = message.chat.type === "private";

  if(message.text === "/start" && privateMessage) {
    bot.sayHello(message.from, (err) => {
      if(err) { console.error('cannot say hello personally');}
      return res.send();
    });
  }

  if(privateMessage) {
    return res.send();
  }

  //Get the current group
  users.findOrCreateGroup(message.chat, (group) => {
    //register the user if not already done
    users.createUserInGroup(message.from, group, (err) => {
      if(err) { console.error('unable to add user to the group');}

      if(message.reply_to_message && message.reply_to_message.id == group.currentAction.messageQuestionId) {
        if(group.currentAction.actionType === "rename") {
          group.name = message.text;
          users.resetAction(group);
          group.save();

          bot.renamedGroup(message.chat, message.text, (err) => {
            if(err) { console.error('cannot rename group :/');}
            return res.send();
          });
        }
        else if(group.currentAction.actionType === "name_transaction") {
          transactions.setName(group.currentTransaction, message.text, (err) => {
            if(err) { console.error('unable to rename transaction'); }
            bot.askForFirstCreditor(message.chat, message.text, (err) => {
              group.currentAction.messageQuestionId = message.id;
              group.currentAction.actionType = "new_creditor";
              group.save();
              return res.send();
            })
          })
        }

      }

      if(message.text.indexOf("/start") === 0) {
        bot.sayHelloToChannel(message.chat, (err) => {
          if(err) { console.error('cannot say hello to the group');}
          //awaiting for a new name for the group
          group.currentAction.messageQuestionId = message.id;
          group.currentAction.actionType = "rename";
          group.save();
          return res.send();
        });
      }
      if(message.text.indexOf("/newtransaction") === 0) {
        transactions.createEmpty(message.from, group, (err) => {
          if(err) { console.error('cannot create transaction');}
          bot.createdEmptyTransaction(message.chat, (err) => {
            group.currentAction.messageQuestionId = message.id;
            group.currentAction.actionType = "name_transaction";
            group.save();
            return res.send();
          });
        });
      }
      else {
        return res.send();
      }
    });
  });


});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
