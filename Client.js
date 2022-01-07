const WebSocket = require("ws");

const messagesTypes = {
  connection: "connection",
  goodbye: "googbye",
  update: "update",
};

const operationTypes = {
  insert: "insert",
  delete: "delete",
};

module.exports = class Client {
  constructor(id, str, portNumber, clientsList, stringOperations) {
    this.id = id;
    this.str = str;
    this.portNumber = portNumber;
    this.clientsList = clientsList;
    this.stringOperations = stringOperations;
    this.ts = [0, id];
    this.server = undefined;
    this.clientsMap = new Map();

    console.log("created client: " + portNumber);
  }

  messageTypeHandler = {
    connection: (data) => {
      console.log(data);
    },
    goodbye: (data) => {
      console.log(data);
    },
    update: (data) => {
      console.log(data);
    },
  };

  handleMessage(data) {
    this.messageTypeHandler[data.type](data);
    console.log(this.portNumber);

    // TS[0] = Math.max(TS[0], data.ts[0]);
    // TS[0]++;
  }

  async createServer() {
    this.server = new WebSocket.Server({ port: this.portNumber });
    console.log("server created: " + this.portNumber);
    this.server.on("connection", (serverSocket) => {
      serverSocket.on("message", (message) => {
        this.handleMessage(JSON.parse(message));
      });
    });
  }

  async connectToOtherClients() {
    // Create array with all the information about the othere clients
    console.log("connect: " + this.portNumber);
    const biggerClients = new Map();

    this.clientsList.forEach((otherClient) => {
      const clientData = otherClient.split(" ");
      const newClient = {
        host: clientData[1],
        port: clientData[2],
        socket: undefined,
      };
      this.clientsMap.set(clientData[0], newClient);
      if (clientData[0] > this.id) {
        biggerClients.set(clientData[0], newClient);
      }
    });

    // Connect to clients with bigger id
    biggerClients.forEach((value) => {
      const socket = new WebSocket(`ws://localhost:${value.port}`);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({ id: this.id, type: messagesTypes.connection })
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
  }

  async sleep(delay) {
    new Promise((resolve) => setTimeout(resolve, delay));
  }

  doTask(operation) {
    // @TODO: Apply one string modification
    const operrationArray = operation.split(" ");
    const messageData = {
      type: messagesTypes.update,
      updateType: operrationArray[0],
    };
    this.handleMessage(messageData);

    // @TODO: send update to all other clients
  }

  async startClient() {
    // The loop
    for (let i = 0; i < this.stringOperations.length; i++) {
      // Add a task to the event loop
      this.doTask(this.stringOperations[i]);

      // Wait some time
      await this.sleep(1000);
    }
  }

  getId() {
    return this.id;
  }

  getPortNumber() {
    return this.portNumber;
  }
};
