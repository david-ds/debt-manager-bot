var Transaction = require('./model').Transaction;

var async = require('async');
var _ = require('underscore');

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

  response.addParticipants = (transactionId, groupMembers, participants, callback) => {
    async.eachSeries(participants, (participant, callb) => {
      var member = _.findWhere(groupMembers, {username: participant.substr(1)});
      if(member) {
        Transaction.update({_id: transactionId, 'participants.user.username': {$ne: member.username}}, {$push: {participants: {user: member}}}, callb);
      }
      else {
        callb();
      }
  }, (err) => {
    if(err) {return callback(null, err);}
    Transaction.findOne({_id: transactionId}, (err, transaction) => {
      callback(err, transaction);
    });

  });
};

  return response;
}
