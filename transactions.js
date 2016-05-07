var Transaction = require('./model').Transaction;

var async = require('async');

module.exports = () => {

  var response = {};

  response.createEmpty = (creator, group, callback) => {
    var emptyTransaction = {
      groupId: group._id,
      creator: {
        username: creator.username,
        firstName: creator.first_name,
        lastName: creator.last_name,
        telegramId: creator.telegramId
      }
    };

    Transaction.create(emptyTransaction, (err, transaction) => {
      group.currentTransaction = transaction._id;
      group.save();
      callback(err);
    });
  }

  response.setName = (transactionId, name, callback) => {
    Transaction.update({_id: transactionId}, {name: name}, (err, transaction) => {
      callback(err);
    })
  }

  response.addCreditor = (transactionId, creditor, amount, callback) => {
    var newCreditor = {
      user: creditor,
      amount: amount
    };
    Transaction.findOneAndUpdate({_id: transactionId}, {$push: {creditors: newCreditor}}, {new: true}, callback);
  }

  response.addAllParticipants = (transactionId, groupMembers, callback) => {
    async.eachSeries(groupMembers, (member, callb) => {
      Transaction.update({_id: transactionId}, {$push: {participants: member}}, callb);
    }, callback);

  };

  return response;
}
