#!/usr/bin/env node

require("dotenv").config();
crypto = require("crypto");

//const { uuid } = require('uuidv4');
const { v4: uuidv4 } = require('uuid');

net = require("net");

const axios = require("axios");
const datagrams = [{}];

var sys = require("sys");
var exec = require("child_process").exec;

// 26 September 2021
console.log("thing-ping 1.0.3 27 August 2022");

//const client = gearmanode.client();
//
/*
Standard stack stuff above.
*/

var hosts = process.env.STATIONS.split(" ");
var channel = process.env.CHANNEL;
var transport = process.env.TRANSPORT;
var interval_minutes = process.env.INTERVAL;
var http_transport = process.env.HTTP_TRANSPORT;
//var username = process.env.USERNAME;
var username = uuidv4();
var password = process.env.PASSWORD;
var from = process.env.FROM;

var station = process.env.STATION;
var clientSecret = process.env.CLIENT_SECRET;

//var minutes = 1,
the_interval = interval_minutes * 60 * 1000;

const hash = crypto.createHmac("sha256", clientSecret);

var data = hash.update(username + password);
//Creating the hash in the required format
var gen_hash = data.digest("hex");

const pass = "";

// Attempt to login in user.
// If not create an account.

signupUser({
  username: gen_hash,
  password: pass,
  email: username + "@null",
})
  .then((token) => {
    return loginUser({
      username: gen_hash,
      password: pass,
    })
      .then((token2) => {
        console.log("Login handleSubmit", token2);

        const { accessToken } = token2;

        setInterval(function () {
          //exec("ping -c 3 localhost", puts);

          //  console.log("I am doing my 1 minute check again");
          // do your stuff here
          console.log("hosts", hosts);
          console.log("accessToken", accessToken);
          hosts.map((h) => {
            var host = h;
            console.log("ping host", host);
            const child = exec(
              "/bin/ping -c 3 " + host,
              (error, stdout, stderr) => {
                console.log("hostx", host);
                const a = puts(
                  error,
                  stdout,
                  stderr,
                  station + " " + host,
                );

                var datagram = JSON.stringify(a);

                if (transport === "apache") {
                  const u = process.env.API_PREFIX;
                  datagramCall(u, datagram, accessToken);
                  datagramCall(http_transport, datagram, null);
                }
              }
            );
          });
        }, the_interval);
      })
      .catch((error) => {
        console.log(error);
        //    const token = signupUser({
        //      username: gen_hash,
        //      password: pass,
        //      email: from,
        //    });
      });
  })
  .catch((error) => {
errorResponse(error);

//    console.log(error);
  });

function puts(error, stdout, stderr, text) {
  console.log("host", text);
  console.log("stdout", stdout);
  const lines = stdout.split("\n");
  console.log("test", lines[lines.length - 2]);
  const line = text + " " + lines[lines.length - 2]; // Because last lin>
  console.log("line", line);
  return handleLine(line);
}

function systemPing(host) {
  console.log("making a systemPing call");
  try {
    var exec = require("child_process").exec;
    const makePingCall = (error, stdout, stderr) => {
      return stdout;
    };

    exec(`ping ${host} -c 3`, makePingCall);
    return makePingCall;
  } catch (error) {
errorResponse(error);

//    console.error("error", error);
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

  // Otherwise this is a different datagram.
  // Save it in local memory cache.

  const timestamp = new Date();
  const utc = timestamp.toUTCString();

  var arr = {
    from: from,
    to: to,
    subject: subject,
    agent_input: agent_input,
    precedence: "routine",
  };
  return arr;
}

function datagramCall(http_transport, datagram, accessToken) {
  axios
    .post(http_transport, datagram, {
      headers: {
        "x-access-token": accessToken,
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      const thing_report = result.data.thingReport;

      // Create a fallback message.
      // Which says 'sms'.
      sms = "sms";
      message = "sms";

      try {
        var sms = thing_report.sms;
        var message = thing_report.message;
      } catch (e) {
        console.error(e);

        var sms = "quiet";
        var message = "Quietness. Just quietness.";
      }

      console.log(sms);
      console.log(message);

      thing_report.log = "nulled";
      //        console.log(thing_report);
      console.log(thing_report.link);
      //    const image_url = thing_report && thing_report.link ? thing_report.link + '.png' : null

      const image_url =
        thing_report && thing_report.image_url ? thing_report.image_url : null;

      //        console.log(image_url);
      if (sms !== null) {
        if (image_url === null) {
          console.log(sms);
        } else {
          console.log(sms);
          console.log("image(s) available");
        }
      }
    })
    .catch((error) => {
errorResponse(error);

//      console.log("datagramCall error", error);
    });
}

async function signupUser(credentials) {
  const { API_PREFIX } = process.env;

  return axios
    .post(API_PREFIX + "/auth/signup", credentials, {
      headers: {
        "Content-Type": "application/json",
      },
      //      })
    })
    .then((data) => {
      console.log(data.data);
      return data.data;
    })
    .catch((error) => {
errorResponse(error);
return {message:"Could not signuip."};

//      console.error(error);
    });
}

async function loginUser(credentials) {
  const { API_PREFIX } = process.env;

  return axios
    .post(API_PREFIX + "/auth/signin", credentials, {
      headers: {
        "Content-Type": "application/json",
      },
      //      })
    })
    .then((data) => {
      console.log("data.data", data.data);
      return data.data;
    })
    .catch((error) => {
errorResponse(error);
return {message:"Could not login."};
    });
}

function errorResponse(error) {

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
      }
      console.log(error.config);


}
