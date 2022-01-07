const WebSocket = require("ws");

const client = {
  // Initial time stemp
  id: -1,
  str: "",
  TS: [0, -1],
  server: undefined,
  portNumber: -1,
  clientsMap: new Map(),
  messagesTypes: {
    connection: "connection",
    goodbye: "googbye",
    update: "update",
  },
  operationTypes: {
    insert: "insert",
    delete: "delete",
  },
  messageTypeHandler: {
    connection: (data) => {
      console.log(data);
    },
    goodbye: (data) => {
      console.log(data);
    },
    // insert: (data) => {
    //   console.log(data);
    //   clientsMap.forEach((value) => {
    //     if (value.socket != undefined) {
    //       value.socket.send(
    //         JSON.stringify({ id: id, type: this.operationTypes.update })
    //       );
    //     }
    //   });
    // },
    update: (data) => {
      console.log(data);
    },
  },
  handleMessage: function (data) {
    this.messageTypeHandler[data.type](data);
    console.log(this.portNumber);

    // TS[0] = Math.max(TS[0], data.ts[0]);
    // TS[0]++;
  },
  // Create the server
  createServer: async function (id, portNum) {
    this.id = id;
    this.portNumber = portNum;
    this.TS[1] = id;
    console.log("port: " + this.portNumber);
    this.server = new WebSocket.Server({ port: this.portNumber });
    console.log("server created");
    this.server.on("connection", (serverSocket) => {
      serverSocket.on("message", (message) => {
        this.handleMessage(JSON.parse(message));
      });
    });
  },
  connectToOtherClients: async function (id, clientsList) {
    // Create array with all the information about the othere clients
    const biggerClients = new Map();

    for (let i = 0; i < clientsList.length; i++) {
      const clientData = clientsList[i].split(" ");
      const newClient = {
        host: clientData[1],
        port: clientData[2],
        socket: undefined,
      };
      this.clientsMap.set(clientData[0], newClient);
      if (clientData[0] > id) {
        biggerClients.set(clientData[0], newClient);
      }
    }

    // Connect to clients with bigger id
    biggerClients.forEach((value) => {
      const socket = new WebSocket(`ws://localhost:${value.port}`);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({ id: id, type: this.messagesTypes.connection })
        );
        value.socket = socket;
      };

      // Handle recieved data
      socket.onmessage = ({ data }) => {
        const msgData = JSON.parse(data);
        handleMessage(msgData);

        TS = Math.max(TS, msgData.ts);
        TS++;
      };
    });
  },
  sleep: (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
  startClient: async function (str, stringOperations) {},
};

async function startClient(id, portNumber, str, clientsList, stringOperations) {
  const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

  function doTask(operation) {
    // @TODO: Apply one string modification
    const operrationArray = operation.split(" ");
    const messageData = {
      type: operrationArray[0],
    };
    handleMessage(messageData);

    // @TODO: send update to all other clients
  }

  // The loop
  for (let i = 0; i < stringOperations.length; i++) {
    // Add a task to the event loop
    doTask(stringOperations[i]);

    // Wait some time
    await sleep(1000);
  }

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

exports.client = client;
// exports.startClient = startClient;
// exports.connectToOtherClients = connectToOtherClients;
// exports.createServer = createServer;
