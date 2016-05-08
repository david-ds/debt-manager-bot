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
      Transaction.update({_id: transactionId}, {$push: {participants: {user: member}}}, callb);
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

response.getTransaction = (transactionId, callback) => {
  Transaction.findOne({_id: transactionId}, callback);
}

response.findByGroup = (group, callback) => {
  Transaction.find({groupId: group._id}).sort({createdAt: -1}).exec(callback);
}

response.balance = (group, callback) => {
  Transaction.find({groupId: group._id}, (err, allTransactions) => {
    if(err) {return callback(err, null);}

    var positiveMembers = [];
    var negativeMembers = [];
    var members = {};
    var situations = {};
    group.members.forEach((member) => {
      members[member.telegramId.toString()] = member;
      situations[member.telegramId.toString()] = 0;
    });
    allTransactions.forEach((transaction) => {
      var totalAmount = 0;

      transaction.creditors.forEach((creditor) => {
        situations[creditor.user.telegramId.toString()] += creditor.amount;
        totalAmount += creditor.amount;
      });

      var averageCost = totalAmount/transaction.participants.length;
      transaction.participants.forEach((participant) => {
        situations[participant.user.telegramId.toString()] -= averageCost;
      });
    });

    var initialSituations = [];
    _.each(members, (member) => {
      initialSituations.push({
        user: member,
        amount: situations[member.telegramId]
      });
    });
    
    _.each(situations, (amount, telegramId) => {
      if(amount >= 0) {
        positiveMembers.push({telegramId: telegramId, amount: amount});
      } else {
        negativeMembers.push({telegramId: telegramId, amount: -amount});
      }
    });

    positiveMembers = _.sortBy(positiveMembers, (member) => {return -member.amount;});
    negativeMembers = _.sortBy(negativeMembers, (member) => {return -member.amount;});



    var whatToDo = [];

    _.each(negativeMembers, (negativeMember) => {
      _.each(positiveMembers, (positiveMember) => {
        var transactionAmount = Math.min(positiveMember.amount, negativeMember.amount);
        positiveMember.amount -= transactionAmount;
        negativeMember.amount -= transactionAmount;

        if(transactionAmount > 0) {
          whatToDo.push({from: members[negativeMember.telegramId], to: members[positiveMember.telegramId], amount: transactionAmount});
        }
      });
    });

    callback(null, whatToDo, initialSituations, members);
  });
}


  return response;
}
