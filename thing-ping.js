#!/usr/bin/env node

/*

Node service to ping a list of identified IP stations,
log locally, and share to an available IP stack.

*/

require("dotenv").config();
crypto = require("crypto");

//const { uuid } = require('uuidv4');
const { v4: uuidv4 } = require("uuid");
const { snapshot } = require("./snapshot");

const prodFlag = false;

net = require("net");

const axios = require("axios");
const datagrams = [{}];

var sys = require("sys");
var exec = require("child_process").exec;
const childProcess = require("child_process");

// 26 September 2021
console.log("thing-ping 1.0.7 15 November 2022");

console.log = function () {};

/*
Standard stack stuff above.
*/

var hosts = process.env.STATIONS.split(" ");
var channel = process.env.CHANNEL;
var transport = process.env.TRANSPORT;
var interval_milliseconds = process.env.INTERVAL;
var http_transport = process.env.HTTP_TRANSPORT;
//var username = process.env.USERNAME;
var username = uuidv4();
var password = process.env.PASSWORD;
var from = process.env.FROM;

var station = process.env.STATION;
var clientSecret = process.env.CLIENT_SECRET;

var snapshotFilename = process.env.SNAPSHOT;

the_interval = interval_milliseconds;

var ping = function (host, username, password) {
  return new Promise(function (resolve, reject) {
    /*stuff using username, password*/
    const t = new Date();
    const p = execute("/bin/ping -c 3 " + host);
    p.then((result) => {
      console.log(result);
      resolve({ text: result, refreshedAt: t, host: host });
    }).catch((error) => {
      console.error("Error pinging",host);
      console.log(error);
      reject(error);
    });
  });
};

//var minutes = 1,

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

        setInterval(
          function () {
            //exec("ping -c 3 localhost", puts);

            const m = [];

            console.log("hosts", hosts);
            console.log("accessToken", accessToken);

            pingHosts(hosts)
              .then((promises) => {
                return resolvePromises(promises, accessToken)
                  .then((result) => {
                    console.log(result);
                  })
                  .catch((error) => {
                    console.error("thing-ping resolvePromises error", error);
                    errorResponse(error);
                  });
              })
              .catch((error) => {
                console.error("thing-ping pingHosts error");
                errorResponse(error);
              });
          },
          [the_interval]
        );
      })
      .catch((error) => {
        console.error("thing-ping Token request error");
        errorResponse(error);
      });
  })
  .catch((error) => {
    console.error("thing-ping Token request error");
    errorResponse(error);
  });

function puts(error, stdout, stderr, host) {
  //console.log("stdout", stdout);
  //return null;
  if (stdout === undefined) {
    return "No output seen.";
  }
  const lines = stdout.split("\n");
  const line = station + " " + host + " " + lines[lines.length - 2]; // Because last lin>
  console.log("line", line);
  return line;
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
    console.error("thing-ping systemPing error");
    errorResponse(error);

    //    console.error("error", error);
  }
}

function makeDatagram(line) {
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
        console.error("thing-ping datagramCall", http_transport);
        console.log("thing-ping datagramCall", e);

        var sms = "quiet";
        var message = "Quietness. Just quietness.";
      }

      console.info(sms);
      console.log(message);

      thing_report.log = "nulled";
      console.log(thing_report.link);
      //    const image_url = thing_report && thing_report.link ? thing_report.link + '.png' : null

      const image_url =
        thing_report && thing_report.image_url ? thing_report.image_url : null;

      //        console.log(image_url);
      if (sms !== null) {
        if (image_url === null) {
          console.log("sms", sms);
        } else {
          console.log("sms", sms);
          console.log("image(s) available");
        }
      }
    })
    .catch((error) => {
      if (error.code === "ENOTFOUND") {
        console.error("Could not find", http_transport);
      }
      errorResponse(error);

      //      console.log("datagramCall error", error);
    });
}

async function pingHosts(hosts) {
  const promises = [];
  await hosts.map((h) => {
    var host = h;
    const p = ping(host, "a", "b");
    promises.push(p);
  });

  return promises;
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
      consoleResponse(data.data);
      return data.data;
    })
    .catch((error) => {
      errorResponse(error);
      return { message: "Could not signuip." };

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
      return { message: "Could not login." };
    });
}

function consoleResponse(result) {
  if (prodFlag === true) {
    return;
  }
  console.log(result);
}

async function resolvePromises(promises, accessToken) {
  console.info("resolvePromises promises length", promises.length);

  const results = await Promise.allSettled(promises)
    .then((values, index) => {
      const arr = [];
      console.log("thing-ping values", values);
      values.map((response) => {
        const result = response.value;

        if (!result) {
          return;
        }

        const line = puts(null, result.text, null, result.host);
        arr.push({
          data: line,
          host: result.host,
          refreshedAt: result.refreshedAt,
        });
      });

      const jsonData = JSON.stringify({ ping: arr });

      console.log("thing-ping jsonData", jsonData);
      fs.writeFile(snapshotFilename, jsonData, "utf8", (error) => {
        if (error) throw error;
        //                  console.log(`Error writing file: ${err}`);
        //                } else {
        console.info("thing-ping wrote file", snapshotFilename);
        //                }
      });
      const datagram = {
        from: "null",
        to: "null",
        subject: "ping",
        agent_input: jsonData,
      };
      if (transport === "apache") {
        const u = process.env.API_PREFIX;
        datagramCall(u + "/thing", datagram, accessToken);
        datagramCall(http_transport, datagram, null);
      }
      return {ping:arr};
    })
    .catch((error) => {
      console.error("Promise all fail");
      errorResponse(error);
    });

  if (results === undefined) {
    console.error("thing-ping no results");
    return Promise.reject("Promises undefined.");
  }

  if (results.ping === undefined) {
    console.error("thing-ping no ping variable");
    return Promise.reject("No ping variable.");
  }


  const validResults =
    results && results.ping && results.ping.filter((result) => !(result instanceof Error));

  return Promise.resolve(validResults);
}

function errorResponse(error) {
  //console.error(error);
  if (error && error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error && error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else if (error && error.message) {
    // Something happened in setting up the request that triggered an Error
    console.log("Error message", error.message);
  } else {
    console.log("error", error);
  }

  console.log("error config", error && error.config);
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
