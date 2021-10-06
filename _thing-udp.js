#!/usr/bin/env node

require("dotenv").config();
//const Discord = require("discord.js");
const UDP = require('udp-node')

const bot = new UDP()

//const { Client, Intents } = require("discord.js");

//const bot = new Client({
//  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
//});

//const TOKEN = process.env.TOKEN;

//bot.login(TOKEN);

// Use for debugging.
const var_dump = require("var_dump");

// Use Gearman to provide the stack connector.
var gearmanode = require("gearmanode");

const client = gearmanode.client();

bot
.set({name: 'Kokopelli',
     type: 'thing',
     port: 10110,
     broadcastAddress: '192.168.10.255'
})
.broadcast()
.onNode((message, rinfo) => {
console.log(message);
console.log(rinfo);
//  console.log('Bot ' + bot.user.username + ' started.');
//});

//client.on('disconnect', message => {
//    client.close();
//    console.log('Bot ' + bot.user.username + ' disconnected.');
//    process.exit(1);
//});

//bot.on("message", (discordMessage) => {
return;
  // Is this a message from a bot?
  if (discordMessage.author.bot) return;

  // Get the from, to and subject from the Keybase message.
  var from = discordMessage.channelId;
  var to = discordMessage.author.id;
  var subject = discordMessage.content;
  var agent_input = discordMessage;
  //console.log(message);
  console.log('Heard, "' + subject + '"');

  // dev display return from Discord.
  // console.log(discordMessage);

  match = false;

  // dev code here to determine whether this is a two person
  // channel.
  /*
// How many folk are in the channel?
    if (stations.length == 1) {
      var to =  message.channel.name
    }

    if (stations.length == 2) {
      match = true;
    }
*/

  // Check if the message mentions the bot.
  if (discordMessage.mentions.has(bot.user)) {
    console.log("Saw the bot mentioned " + bot.user.id);
    match = true;
  }

  // Add a list of words the bot should be responsive to.
  if (subject.toLowerCase().includes("ednabot")) {
    match = true;
  }

  if (subject.toLowerCase().includes("edna")) {
    match = true;
  }

  if (subject.toLowerCase().includes("control")) {
    match = true;
  }

  if (match == false) {
    return;
  }

  var arr = { from: from, to: to, subject: subject, agent_input: agent_input };
  var datagram = JSON.stringify(arr);

  try {
    var job = client.submitJob("call_agent", datagram);
  } catch (e) {
    console.log(e);

    var sms = "quiet";
    var message = "Quietness. Just quietness.";
  }

  job.on("workData", function (data) {
    // Uncomment for debugging/testing.
    //    console.log('WORK_DATA >>> ' + data);
  });

  job.on("complete", function () {
    // Create a fallback message.
    // Which says 'sms'.
    sms = "sms";
    message = "sms";

    try {
      var thing_report = JSON.parse(job.response);
      var sms = thing_report.sms;
      var message = thing_report.message;
    } catch (e) {
      console.log(e);

      var sms = "quiet";
      var message = "Quietness. Just quietness.";
    }

    console.log(sms);
    console.log(message);

    // Respond to the channel with the sms
    // channel response.
    discordMessage.channel.send(sms);

    // dev exploring ways to respond.
    // discordMessage.reply(sms);
    // message.lineReply(sms); //Line (Inline) Reply with mention
    // message.lineReplyNoMention(`My name is ${client.user.username}`); //L
  });
});
