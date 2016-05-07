var Group = require('./model').Group;

var _ = require('underscore');


module.exports = () => {


  var response = {};

  response.findOrCreateGroup = (chat, callback) => {
    var newGroup = {
      telegramId: chat.id,
      telegramName: chat.title,
      members: []
    };

    Group.findOneOrCreate({telegramId: chat.id}, newGroup, (err, group) => {
      if(err) { console.error('error while fetching group');}
      callback(group);
    })
  };

  response.createUserInGroup = (user, group, callback) => {
    if (_.where(group.members, {telegramId: user.id}).length === 0) {
      //The user is not registered yet

      var newUser = {
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        telegramId: user.id
      };

      Group.findOneAndUpdate({_id: group._id}, {$push: {members: newUser}}, {},  (err, doc) => {
        callback(err);
      })
    }
    else { callback(0);}
  };

  response.resetAction =(group) => {
    group.currentAction.actionType = "";
    group.currentAction.messageQuestionId = 0;
  }

  return response;
};
