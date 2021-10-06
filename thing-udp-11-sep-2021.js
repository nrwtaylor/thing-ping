#!/usr/bin/env node

require("dotenv").config();

net = require("net");

const datagrams = [{}];

const var_dump = require("var_dump");

// Use Gearman to provide the stack connector.
var gearmanode = require("gearmanode");

const client = gearmanode.client();

const clients = net.connect({ port: 10110 }, () => {
  // 'connect' listener
  console.log("connected to server!");
  clients.write("world!\r\n");
});


clients.on("data", (data) => {
  //  console.log(data.toString());

  // Get the from, to and subject from the datagram.
  var from = "agent";
  var to = "192.168.10.123:10110";
  const subject = data.toString();
  var agent_input = data;

  match = false;

  // Filter by transducer
  if (subject.includes("$TZXDR")) {
    match = true;
  }

  //  if (subject.toLowerCase().includes("control")) {
  //    match = true;
  //  }

  if (match == false) {
    console.log("NOT TZXDR");
    return;
  }

  console.log("PASSED " + subject);

  // Parse NMEA XDR.
  const parts = subject.split(",");
  const sentence = parts[0];
  const value = parts[2];
  const units = parts[3];

  const moreParts = parts[4].split("*");
  const name = moreParts[0];

  if (datagrams[name]) {

    if (
      datagrams[name].name === name &&
      datagrams[name].value === value &&
      datagrams[name].units === units
    ) {
      console.log("SAME");
      return;
    }

    // Basic noise filter.
    const percentSimilar = 0.03;

    if (
      datagrams[name].name === name &&
      (datagrams[name].value < value * (1 + percentSimilar) &&
datagrams[name].value > value * (1 - percentSimilar)
) &&
      datagrams[name].units === units
    ) {
      console.log("SIMILAR within " + percentSimilar * 100 + "%");
      return;
    }



  }

  // Otherwise this is a different datagram.
  // Save it in local memory cache.

  console.log("SUBJECT", subject);
  const timestamp = new Date();
  const utc = timestamp.toUTCString();

  // How old is the existing datapoint?
  if (datagrams[name] && datagrams[name].refreshedAt) {
    const lastRefreshedAt = Date.parse(datagrams[name].refreshedAt);
    const age = timestamp - lastRefreshedAt;

    console.log("age", age); // milliseconds

    // Skip if age is too new.
    if (age < 10000) {
      console.log("NOT OLD ENOUGH");
      return;
    }

    datagrams[name] = {
      name: name,
      value: value,
      units: units,
      refreshedAt: utc,
    };
  } else if (datagrams[name] === undefined) {
    datagrams[name] = {
      name: name,
      value: value,
      units: units,
      refreshedAt: utc,
    };
  }

  const dropSetting = -1;
  // Randomly drop (overload protection).
  const roll = Math.floor(Math.random() * 6) + 1;
  console.log("rool", roll);
  if (roll < dropSetting) {
    console.log("DROPPED");
    return;
  }

  console.log(datagrams[name]);

  var arr = { from: from, to: to, subject: subject, agent_input: agent_input };
  var datagram = JSON.stringify(arr);

  try {
    var job = client.submitJob("call_agent", datagram);
console.log("SENT DATAGRAM TO GEARMAN");
console.log(datagram);
  } catch (e) {
    console.log(e);

    var sms = "quiet";
    var message = "Quietness. Just quietness.";
  }

  job.on("workData", function (data) {
    // Uncomment for debugging/testing.
    //    console.log('WORK_DATA >>> ' + data);
  });

  job.on('fail', function(handle) { 
console.log("FAIL");
 });

  job.on("complete", function () {
    // Create a fallback message.
    // Which says 'sms'.
    sms = "sms";
    message = "sms";

    try {
console.log("Job complete",job);
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

    // No response to the message
    // Just log for now.
    //    discordMessage.channel.send(sms);

    // dev exploring ways to respond.
    // discordMessage.reply(sms);
    // message.lineReply(sms); //Line (Inline) Reply with mention
    // message.lineReplyNoMention(`My name is ${client.user.username}`); //L
  });

  //  clients.end();
});
clients.on("end", () => {
  console.log("disconnected from server");
});

/*
socket.on('listening', () => {
  let addr = socket.address();
  console.log(`Listening for UDP packets at ${addr.address}:${addr.port}`);
});

socket.on('error', (err) => {
  console.error(`UDP error: ${err.stack}`);
});

socket.on('message', (msg, rinfo) => {
  console.log('Recieved UDP message');
});
*/

/*
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
*/
