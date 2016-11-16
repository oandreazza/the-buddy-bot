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
          { name: "CRM"},
          { name: "BDO"}
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
  var userFilter =  getUserApps().pos.filter(
    (element) => filterByApp(element,appName)
  )

  return userFilter.length > 0 ? userFilter[0] : {}
}

var filterByApp = function (element, appName){
  return element.apps.some( (app) => new RegExp('\\b' + appName + '\\b','i').test(app.name))
}


controller.hears(['RDM FINALIZADA', 'rdm finalizada'], ['mention', 'direct_mention', 'direct_message'], function(bot,message) {
    var appName;
    var appVersion;
    allUsers( (users) => slackusers = users);

    var askApp = function(err, convo){
      convo.ask('Qual sistema ?',function(response, convo){
        appName = response.text;
        convo.sayFirst('Ótimo! Vou procurar quem é o dono...');
        var poOwned = getUserByApp(appName);
        if(!poOwned.id){
          convo.say("Droga! Não achei ninguem correspondente para o sistema " + appName)
          convo.say("Vamos tentar novamente...");
          convo.repeat();
        }else{
          var poId = poOwned.id;
          userToValidate = findUserByName(poId)

          askVersion(response,convo);

        }
        convo.next();

      });
    }

    var askVersion = function(err, convo){
      convo.ask('Qual a versão do '+appName+' ?',function(response,conv){
        appVersion = response.text;
        convo.say('Ótimo, achei!! Já estou indo falar com o '+userToValidate.real_name)

        initializePrivateConversion(response,convo)

        convo.next();
      })
    }

    var initializePrivateConversion = function (err, convo){
      var message = 'Olá ' + userToValidate.real_name + '! Precisamos que você valide o ' + appName + ' versão '+ appVersion
      var consversationData = {user:userToValidate.id, message: message }
      bot.startPrivateConversation(consversationData, function(err,convo){
        if (err) {
           console.log(err);
         } else {
           convo.say(consversationData.message);
         }
       })
       convo.next()
    }

    bot.startConversation(message, askApp);
});

controller.hears('\\[Desenvolvimento\\] Sistema: (.*):(.*)', ['mention', 'direct_mention', 'direct_message'], function(bot,message) {
  var app = message.match[1];
  var appVersion = message.match[2];

  bot.reply(message, "Que ótimo estou buscando o respectivo dono do " + app);

  allUsers( (users,message) => {
    slackusers = users;

    var poOwned = getUserByApp(app);
    var user = findUserByName(poOwned.id);

    bot.reply(message,"Achei! Já estou indo avisar o " + user.real_name);
    var message = "Olá " +user.real_name+ ", o " + app + " na versão "+appVersion+" foi realizado com sucesso em produção";
    var consversationData = {user:user.id, message: message}
    bot.startPrivateConversation(consversationData, function(err,convo){
        if (err) {
           console.log(err);
         } else {
           convo.say(consversationData.message);
         }
    })

  });


})
