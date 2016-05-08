var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var telegramApi = require('./telegram')();

var bot = require('./bot')(telegramApi);

var users = require('./users')();
var transactions = require('./transactions')();

var _ = require('underscore');


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

  if(privateMessage) {
    if(message.text.indexOf("/start") === 0) {
      bot.sayHello(message.from, (err) => {
        if(err) { console.error('cannot say hello personally');}
        return res.send();
      });
    }
    else {
      return res.send();
    }
  }
  else {

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

        else if(group.currentAction.actionType === "new_creditor") {
          if(message.text === "stop") {
            group.currentAction.messageQuestionId = message.id;
            group.currentAction.actionType = "new_participant";
            group.save();
            bot.askForFirstParticipant(message.chat, (err) => {
              if(err) { throw "unable to ask for first participant";}
              return res.send();
            });
          }
          else {
            var usernameAndAmount = message.text.split(" ");
            var username = "", amount = 0;
            var user = {};
            var errorParsing = false;
            try {
              username = usernameAndAmount[0];
              amount = parseFloat(usernameAndAmount[1]);
              if(isNaN(amount)) { throw "Not a valid amount"; }
              user = _.find(group.members, {username: username.substr(1)});
              if(!user) { throw "Invalid user";}
            }
            catch(e) {
                errorParsing = true;
            }
            if(errorParsing) {
              bot.sayInvalidCreditor(message.chat, (err) => {
                if(err) { throw "Unable to say invalid creditor"};
                return res.send();
              });
            }
            else {
              transactions.addCreditor(group.currentTransaction, user, amount, (err, transaction) => {
                bot.askForCreditor(message.chat, transaction, (err) => {
                  if(err) { throw "Unable to ask for new creditor";}
                  return res.send();
                })
              });
            }
          }
        }
        else if(group.currentAction.actionType === "new_participant") {

          if(message.text === "everybody") {
            transactions.addAllParticipants(group.currentTransaction, group.members, (err) => {
              if(err) {throw "unable to add all participants"}
              bot.everyoneHadParticipated(message.chat, group.members, (err) => {
                if(err) { throw "unable to say everybody partipated";}
                group.currentAction.actionType = "confirmation_transaction";
                group.currentAction.messageQuestionId = message.id;
                transactions.getTransaction(group.currentTransaction, (err, transaction) => {
                  bot.transactionSummary(message.chat, transaction, (err) => {
                    if(err) { throw "unable to sum up the transaction";}
                    return res.send();
                  });
                });
              })
            });
          }
          else if(message.text === "stop") {
            group.currentAction.messageQuestionId = message.id;
            group.currentAction.actionType = "confirmation_transaction";
            group.save();
            transactions.getTransaction(group.currentTransaction, (err, transaction) => {
              bot.transactionSummary(message.chat, transaction, (err) => {
                if(err) { throw "unable to sum up the transaction";}
                return res.send();
              });
            });
          }
          else {
            var participants = message.text.split(" ");
            transactions.addParticipants(group.currentTransaction, group.members, participants, (err, transaction) => {
              if(err) { throw "unable to add some participants ";}
              bot.participantsAdded(message.chat, transaction, (err) => {
                if(err) { throw "unable to say some participants added";}
                return res.send();
              })
            });
            return res.send();
          }
        }
        else if(group.currentAction.actionType === "confirmation_transaction") {
          if(message.text === "Yes") {
            bot.endTransaction(message.chat, (err) => {
              if(err) { throw "unable to say end of transaction"};
              group.currentAction.actionType = null;
              group.currentAction.messageQuestionId = null;
              group.currentTransaction = null;
              group.save();
              return res.send();
            });
          }
          else {
            bot.problemTransaction(message.chat, (err) => {
              if(err) { throw "unable to say end of transaction"};
              group.currentAction.actionType = null;
              group.currentAction.messageQuestionId = null;
              group.currentTransaction = null;
              group.save();
              return res.send();
            });
          }
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
      else if(message.text.indexOf("/newtransaction") === 0) {
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
      else if(message.text.indexOf("/transactions") === 0) {
        transactions.findByGroup(group, (err, transactions) => {
          if(err) { throw err;}
          bot.sendTransactions(message.chat, transactions, (err) => {
            if(err) { throw "unable to send transactions";}
            return res.send();
          })

        });
      }
      else if(message.text.indexOf("/balance") === 0) {
        transactions.balance(group, (err, balance) => {
          if(err) { throw err;}
          bot.sendBalance(message.chat, balance, (err) => {
            if (err) { throw "unable to send balance" }
            return res.send();
          });
        });
      }
      else {
        return res.send();
      }
    });
  });

}
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
