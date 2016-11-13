var Botkit = require('botkit');

var controller = Botkit.slackbot();


var bot = controller.spawn({

  token:process.env.SLACK_TOKEN

})



bot.startRTM(function(err,bot,payload) {

  if (err) {

    throw new Error('Could not connect to Slack');

  }

});

var slackusers = [];
var userToValidate = {};

function allUsers(fn) {
    bot.api.users.list({},function(err,response){
      fn(response.members);
    })
}
var findUserByName = function(username){
    var user =  slackusers.filter( (user) => user.name === username )
    return user.length > 0 ? user[0] : {};
}

var getUserApps = function(){

  var data = {
    pos: [
      {
        id: 'mauricio.sganderla',
        apps:[
          { name: "SAPC"},
          { name: "CRM"}
        ]
      },
      {
        id: "gustavo.pacheco",
        apps:[
          { name: "SIGMA"},
          { name: "SGM"}
        ]
      }
    ]
  };
  return data;
}

var getUserByApp = function(appName){
  return getUserApps().pos.filter(
    (element) => filterByApp(element,appName)
  )
}

var filterByApp = function (element, appName){
  return element.apps.some( (app) => new RegExp('\\b' + appName + '\\b','i').test(app.name))
}


controller.hears(['RDM FINALIZADA', 'rdm finalizada'], ['mention', 'direct_mention', 'direct_message'], function(bot,message) {

  allUsers( (users) => slackusers = users);
  // start a conversation to handle this response.

    var askApp = function(err, convo){
      convo.ask('Qual sistema ?',function(response, convo){
        var appName = response.text;
        var poOwned = getUserByApp(appName)
        var poId = poOwned[0].id;
        userToValidate = findUserByName(poId)
        convo.setVar('app', appName);
        convo.say('Ótimo! Vou procurar quem é o dono...');

        askVersion(response,convo);

        convo.next();
      });

      var askVersion = function(err, convo){
        convo.ask('Qual a versão do {{vars.app}} ?',function(response,conv){
          var version = response.text;
          convo.setVar('appVersion', version);
          convo.say('Ótimo, achei!! Já estou indo falar com o '+userToValidate.real_name)

          initializePrivateConversion(response,convo)

          convo.next();
        })
      }

      var initializePrivateConversion = function (err, convo){

        var message = 'Olá ' + userToValidate.real_name + '! Precisamos que você valide o {{vars.app}} versão {{vars.appVersion}}'
        console.log(message);
        var consversationData = {user:userToValidate.id, message: message }
        bot.startPrivateConversation(consversationData, function(err,convo){
          if (err) {
             console.log(err);
           } else {
             convo.say(consversationData.message);
           }
         })
      }
    }

    bot.startConversation(message, askApp);



});
