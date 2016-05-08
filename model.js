var mongoose = require('mongoose');
var findOneOrCreate = require('mongoose-find-one-or-create');


var mongooseConnection = process.env.OPENSHIFT_MONGODB_DB_URL || "mongodb://mongo/";
mongooseConnection += process.env.OPENSHIFT_APP_NAME || "debtmanager";

mongoose.connect(mongooseConnection);

var groupSchema = new mongoose.Schema({
  telegramId: Number,
  telegramName: String,
  name: String,
  members: [{
    username: String,
    firstName: String,
    lastName: String,
    telegramId: Number
  }],
  lastDebtPaidDate: {type: Date, default: Date.now},
  currentTransaction: mongoose.Schema.Types.ObjectId,
  currentAction: {
    messageQuestionId: Number,
    actionType: String
  }
});

groupSchema.plugin(findOneOrCreate);

var transactionSchema = new mongoose.Schema({
  groupId: mongoose.Schema.Types.ObjectId,
  name: String,
  createdAt: { type: Date, default: Date.now },
  creditors: [{
    user: {
      username: String,
      firstName: String,
      lastName: String,
      telegramId: Number
    },
    amount: Number
  }],

  participants: [{
    user: {
      username: String,
      firstName: String,
      lastName: String,
      telegramId: Number
    }
  }],
  creator: {
    username: String,
    firstName: String,
    lastName: String,
    telegramId: Number
  }
});

module.exports = {
  Group: mongoose.model('Group', groupSchema),
  Transaction: mongoose.model('Transaction', transactionSchema)
};
