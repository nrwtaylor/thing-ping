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

const lines = data.toString().split("\n");

lines.map((line) => {
//console.log(line);
handleLine(line);
});
//console.log(data);
//handleData(data);
});

function handleLine(line) {
  //  console.log(data.toString());

  // Get the from, to and subject from the datagram.
  var from = "agent";
  var to = "kokopelli:#general@kaiju.discord"; // or var to = "192.168.10.123:10110";
  const subject = line;
  var agent_input = line;

  match = false;

  // Filter by transducer
  if (subject.includes("$TZXDR")) {
    match = true;
  }

  //  if (subject.toLowerCase().includes("control")) {
  //    match = true;
  //  }

  if (match == false) {
process.stdout.write(".");
    //console.log("NOT TZXDR");
    return;
  }
process.stdout.write("\n");

  // Parse NMEA XDR.
  const parts = subject.split(",");
  const sentence = parts[0];
  const value = parts[2];
  const units = parts[3];

  const moreParts = parts[4].split("*");
  const name = moreParts[0];
  console.log(subject);
  if (datagrams[name]) {

    if (
      datagrams[name].name === name &&
      datagrams[name].value === value &&
      datagrams[name].units === units
    ) {
      console.log("SKIPPED SAME");
      return;
    }

    // Basic noise filter.
    const percentSimilar = 0.001;

    if (
      datagrams[name].name === name &&
      (datagrams[name].value < value * (1 + percentSimilar) &&
datagrams[name].value > value * (1 - percentSimilar)
) &&
      datagrams[name].units === units
    ) {
      console.log("SKIPPED SIMILAR within " + percentSimilar * 100 + "%");
      return;
    }



  }

  // Otherwise this is a different datagram.
  // Save it in local memory cache.

  //console.log("SUBJECT", subject);
  const timestamp = new Date();
  const utc = timestamp.toUTCString();

  // How old is the existing datapoint?
  if (datagrams[name] && datagrams[name].refreshedAt) {
    const lastRefreshedAt = Date.parse(datagrams[name].refreshedAt);
    const age = timestamp - lastRefreshedAt;

    console.log("age", age); // milliseconds

    // Skip if age is too new.
    if (age < 60000) {
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

job.on("error", function(err){
    console.log("ERROR: ", err.message || err);
    gearman.close();
});

  job.on('fail', function(handle) { 
console.log("FAIL");
 });

 job.on('failed', function() {
     console.log('FAILURE >>> ' + job.handle);
     client.close();
 });
 job.on('exception', function(text) { // needs configuration of job server session (JobServer#setOption)
     console.log('EXCEPTION >>> ' + text);
     client.close();
 })

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
}

clients.on("end", () => {
  console.log("disconnected from server");
});

