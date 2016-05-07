var Transaction = require('./model').Transaction;

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

  return response;
}
