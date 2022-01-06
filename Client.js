const axios = require("axios");

const http = require("http");
const WebSocket = require("ws");

function client(id, portNumber, str, clientsList, stringOperations) {
  // create array with all the information about the othere clients
  console.log("\nI am client: " + id);
  const clientsArray = [];

  for (let i = 0; i < clientsList.length; i++) {
    const clientData = clientsList[i].split(" ");
    clientsArray.push({
      id: clientData[0],
      host: clientData[1],
      port: clientData[2],
    });
  }

  const biggerClients = clientsArray.filter((client) => id < client.id);

  // Connect to clients with bigger id
  for (let i = 0; i < biggerClients.length; i++) {
    console.log("try to connect: " + biggerClients[i].port);
    const socket = new WebSocket(`ws://localhost:${biggerClients[i].port}`);

    socket.onopen = function () {
      socket.send("hi!");
    };

    socket.onmessage = function ({ data }) {
      console.log("the message is: ");
      console.log(data);
    };
  }

  // Create the server
  const server = new WebSocket.Server({ port: portNumber });

  server.on("connection", function (serverSocket) {
    serverSocket.on("message", function (message) {
      console.log("i am here");
      serverSocket.send("YAAAYYYY!!!");
    });
  });

  // server.listen(portNumber);

  server.on("connection", (socket) => {
    console.log("connected!");
  });

  console.log("listening on port " + portNumber);
  // Connect to clients:
  // 1. Connect to clients with greater id
  // 2. Start HTTP server
  // 3. Each socket defined with callback function for handling recieved data
  // 4. Set this client initiel vector time-stemp
  // 5. Run loop
  // When all given local string modifications are done- send "goodbye" message to all clients.
  // When "goodbye" message recieved from all other clients- print this client replica and exit.

  // The callback function:
  // 1. Updates this client vector time-stemp
  // 2. Apply merge algorithm

  // The loop:
  // For each operation:
  // 1. Add task to event loop:
  //    * Apply one string modification
  //    * Send the update to all clients
  // 2. Wait some time
}

exports.startClient = client;
