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
function allUsers(fn) {
    bot.api.users.list({},function(err,response){
      fn(response.members);
    })
}
var findUserByName = function(username){
    var user =  slackusers.filter( (user) => user.name === username )
    return user.length > 0 ? user[0] : {};
}





controller.hears(['RDM FINALIZADA', 'rdm finalizada'], ['mention', 'direct_mention', 'direct_message'], function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {
    allUsers( (users) => slackusers = users);

    convo.ask('Qual sistema?',function(response,convo) {
      var appName = response.text;
      var data =
      {
        pos: [
          {
            id: 'schunck',
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

      var poOwned = data.pos.filter(
        (element) => filterByApp(element,appName)
      )

      function filterByApp(element, appName){
        return element.apps.some( (app) => new RegExp('\\b' + appName + '\\b','i').test(app.name))
      }

      var poId = poOwned[0].id;
      var slackUser = findUserByName(poId)


      convo.say(`Ótimo! Vou falar com o <@${poId}> para validar o  ${appName}`);
      convo.next();



      var data = {user:slackUser.id, message:  `Ola! Valida para nos o ${appName}`}
      bot.startPrivateConversation(data, function(err,convo){
        if (err) {
                 console.log(err);
               } else {
                 convo.say(data.message);
               }
      })





    });
  })



});
