#!/usr/bin/env node

require("dotenv").config();

net = require("net");

const axios = require("axios");
const fs = require("fs");

const datagrams = [{}];

const var_dump = require("var_dump");

// Use Gearman to provide the stack connector.
var gearmanode = require("gearmanode");

var sys = require("sys");
var exec = require("child_process").exec;
const childProcess = require("child_process");
// 26 September 2021
console.log("thing-ping 1.0.2 23 July 2022");

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
var transport = process.env.TRANSPORT;
var interval_milliseconds = process.env.INTERVAL;
var http_transport = process.env.HTTP_TRANSPORT;
var station = process.env.STATION;
var snapshotFilename = process.env.SNAPSHOT;
//var minutes = 1,
the_interval = interval_milliseconds;

setInterval(function () {
  //exec("ping -c 3 localhost", puts);

  //  console.log("I am doing my 1 minute check again");
  // do your stuff here
  console.log("hosts", hosts);
  const arr = [];
  const promises = [];
  hosts.map((h) => {
    var host = h;
    console.log("ping host", host);
    /*
    execute("/bin/ping -c 3 " + host).then((result) => {
      const line = puts(null, result, null, host);
      console.log("result", result);
      arr.push({ data: line });
    });
*/

    const p = execute("/bin/ping -c 3 " + host);
    promises.push(p);
    //    const child = exec("/bin/ping -c 3 " + host, (error, stdout, stderr) => {
    //      console.log("hostx", host);
    //      const line = puts(error, stdout, stderr, host);
    //    });

    //console.log("host line", host, line);
    //arr.push({data:test});
    //console.log(test);
  });

  Promise.all(promises).then((values) => {
    const arr = [];

    console.log(values);
    values.map((result) => {
      const line = puts(null, result, null, null);
      console.log("result", result);
      arr.push({ data: line });
    });

    console.log("jsonData arr", arr);
    const jsonData = JSON.stringify({ test: arr });
    console.log("jsonData stringify", jsonData);
    fs.writeFile(snapshotFilename, jsonData, "utf8", (err) => {
      if (err) {
        console.log(`Error writing file: ${err}`);
      } else {
        console.log(`File is written successfully!`);
      }
    });
  });
}, the_interval);

function puts(error, stdout, stderr, host) {
  console.log("host", host);
  console.log("stdout", stdout);
  const lines = stdout.split("\n");
  console.log("test", lines[lines.length - 2]);
  const line = station + " " + host + " " + lines[lines.length - 2]; // Because last lin>
  console.log("line", line);
  handleLine(line);
  return line;
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

  //console.log(subject);

  // Otherwise this is a different datagram.
  // Save it in local memory cache.

  //console.log("SUBJECT", subject);
  const timestamp = new Date();
  const utc = timestamp.toUTCString();

  var arr = {
    from: from,
    to: to,
    subject: subject,
    agent_input: agent_input,
    precedence: "routine",
  };
  var datagram = JSON.stringify(arr);
  //       .post("https://stackr.ca/api/whitefox/message", datagram, {

  if (transport === "apache") {
    axios
      .post(http_transport, datagram, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((result) => {
        const thing_report = result.data.thingReport;

        //console.log("thing_report", thing_report);

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
        //    console.log(thing_report);
        //    console.log(thing_report.link);
        //    const image_url = thing_report && thing_report.link ? thing_report.link + '.png' : null

        const image_url =
          thing_report && thing_report.image_url
            ? thing_report.image_url
            : null;

        console.log(image_url);
        if (sms !== null) {
          if (image_url === null) {
            console.log(sms);
            //        discordMessage.channel.send(sms);
          } else {
            console.log(sms);
            console.log("image(s) available");
            //        discordMessage.channel.send(sms, { files: [image_url] });
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

function execute(command) {
  /**
   * @param {Function} resolve A function that resolves the promise
   * @param {Function} reject A function that fails the promise
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
   */
  return new Promise(function (resolve, reject) {
    /**
     * @param {Error} error An error triggered during the execution of the childProcess.exec command
     * @param {string|Buffer} standardOutput The result of the shell command execution
     * @param {string|Buffer} standardError The error resulting of the shell command execution
     * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
     */
    childProcess.exec(command, function (error, standardOutput, standardError) {
      if (error) {
        reject();

        return;
      }

      if (standardError) {
        reject(standardError);

        return;
      }

      resolve(standardOutput);
    });
  });
}
