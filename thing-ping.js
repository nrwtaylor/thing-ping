#!/usr/bin/env node

require("dotenv").config();

net = require("net");

const datagrams = [{}];

const var_dump = require("var_dump");

// Use Gearman to provide the stack connector.
var gearmanode = require("gearmanode");

var sys = require("sys");
var exec = require("child_process").exec;

// 26 September 2021
console.log("thing-ping 1.0.1 4 June 2022");

const client = gearmanode.client();
//
/*
Standard stack stuff above.
*/
//var ping = require('ping');
//var Ping = require('ping-wrapper')
//Ping.configure();

var hosts = process.env.STATIONS.split(" ");
var channel = process.env.CHANNEL;
var minutes = 1,
the_interval = minutes * 60 * 1000;

setInterval(function () {
  //exec("ping -c 3 localhost", puts);

  //  console.log("I am doing my 1 minute check again");
  // do your stuff here
  console.log("hosts", hosts);
  hosts.map((h) => {
    var host = h;
    console.log("ping host", host);
    const child = exec("/bin/ping -c 3 " + host, (error, stdout, stderr) => {
      console.log("hostx", host);
      puts(error, stdout, stderr, host);
    });
  });
}, the_interval);

function puts(error, stdout, stderr, host) {
  console.log("host", host);
  console.log("stdout",stdout);
  const lines = stdout.split("\n");
  console.log("test", lines[lines.length -2]);
  const line = host + " " + lines[lines.length - 2] ; // Because last lin>
  console.log("line",line);
  handleLine(line);
}

function systemPing(host) {
  console.log("making a systemPing call");
  try {
    var exec = require("child_process").exec;
    const makePingCall = (error, stdout, stderr) => {
      //console.log("makePingCall", error, stdout, stderr);
      console.log("stdout", stdout);
      return stdout;
    };

    exec(`ping ${host} -c 3`, makePingCall);
    return makePingCall;
  } catch (error) {
    console.error("error", error);
  }
}

function handleLine(line) {
  //  console.log(data.toString());

  // Get the from, to and subject from the datagram.

  // Context A. Datagram is an *implied* request from a channel address.
  //var from = "kokopelli:#general@kaiju.discord"; // or var to = "192.168.10.123:10110";
  //var to = "ping";

  // Context B. Datagram is originated from agent.
  // So the datagram has directionality.

  /*
        REFERENCE
        $datagram = [
            "to" => "null" . $this->mail_postfix,
            "from" => "job",
            "subject" => "s/ job stack",
        ];
  */

  var to = channel;
  var from = "ping";

  const subject = line;
  var agent_input = "ping";

  //  match = false;

  console.log(subject);

  // Otherwise this is a different datagram.
  // Save it in local memory cache.

  //console.log("SUBJECT", subject);
  const timestamp = new Date();
  const utc = timestamp.toUTCString();

  var arr = { from: from, to: to, subject: subject, agent_input: agent_input, precedence:'routine' };
  var datagram = JSON.stringify(arr);


  const transport = "gearman";


  if (transport === "apache") {
    axios
      .post("https://stackr.ca/api/whitefox/message", datagram, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((result) => {
const thing_report = result.data.thingReport;

console.log("thing_report", thing_report);


    // Create a fallback message.
    // Which says 'sms'.
    sms = "sms";
    message = "sms";

    try {
//      var thing_report = JSON.parse(job.response);
      var sms = thing_report.sms;
      var message = thing_report.message;
      //var agent = thing_report.agent;
      //var uuid = thing_report.thing.uuid;
    } catch (e) {
      console.log(e);

      var sms = "quiet";
      var message = "Quietness. Just quietness.";
    }

    console.log(sms);
    console.log(message);
    console.log(thing_report.png);
    console.log(thing_report.pngs);

    thing_report.log = "nulled";
    console.log(thing_report);
    console.log(thing_report.link);
    //    const image_url = thing_report && thing_report.link ? thing_report.link + '.png' : null

    const image_url =
      thing_report && thing_report.image_url ? thing_report.image_url : null;

    console.log(image_url);
    //    var agent = thing_report.agent;
    //    var uuid = thing_report.thing.uuid;
    //var image_url = "https://stackr.ca/pixel_sml.png";
    //    var image_url = 'https://stackr.ca/thing/' + uuid + '/' + agent + '.png';

    // Respond to the channel with the sms
    // channel response.
    //    discordMessage.channel.send(sms, {files: ["https://stackr.ca/pixel_sml.png"]});
    //    discordMessage.channel.send(sms, {files: [image_url]});
    if (sms !== null) {
      if (image_url === null) {
        discordMessage.channel.send(sms);
      } else {
        discordMessage.channel.send(sms, { files: [image_url] });
      }
    }




      })
      .catch((error) => {
        console.log(error);
      });
  }





  if (transport === "gearman") {


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

  job.on("error", function (err) {
    console.log("ERROR: ", err.message || err);
    gearman.close();
  });

  job.on("fail", function (handle) {
    console.log("FAIL");
  });

  job.on("failed", function () {
    console.log("FAILURE >>> " + job.handle);
    client.close();
  });
  job.on("exception", function (text) {
    // needs configuration of job server session (JobServer#setOption)
    console.log("EXCEPTION >>> " + text);
    client.close();
  });

  job.on("complete", function () {
    // Create a fallback message.
    // Which says 'sms'.
    sms = "sms";
    message = "sms";

    try {
      //console.log("Job complete",job);
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
}

}
