const WebSocket = require("ws");
const log = require("./Logging");

const messagesTypes = {
  connection: "connection",
  goodbye: "goodbye",
  update: "update",
};

const operationTypes = {
  insert: "insert",
  delete: "delete",
};

const logTypes = {
  receivedUpdate: "receivedUpdate",
  startedMerging: "startedMerging",
  updateOperation: "updateOperation",
  endedMerging: "endedMerging",
  removedOperation: "removedOperation",
  finishedLocalModifications: "finishedLocalModifications",
  exiting: "exiting",
};

function getRandomInt() {
  return Math.floor(Math.random() * 800) + 200;
}

module.exports = class Client {
  constructor(id, str, portNumber, clientsList, stringOperations) {
    this.id = id;
    this.str = str;
    this.portNumber = portNumber;
    this.clientsList = clientsList;
    this.stringOperations = stringOperations;
    this.timestemp = [0, id];
    this.server = undefined;
    this.clientsMap = new Map();
    this.history = [
      { operation: "", timestemp: this.timestemp, str: this.str },
    ];
    this.clientsCounter = 0;
    this.biggerClients = new Map();
    this.saidGoodbye = false;
  }

  /**********
   * messageTypeHandler:
   *
   * 1. connection:
   *      data: {
   *        id: nember,
   *        socket: socket,
   *      }
   *
   * 2. goodbye:
   *    data: {
   *
   *    }
   *
   * 3. update:
   *    data: {
   *      clientId: number,
   *      senderId: number,
   *      operation: string,
   *      timestemp: [number, number]
   *    }
   *
   **********/

  messageTypeHandler = {
    connection: (data) => {
      // Add the socket to the client
      const otherClient = this.clientsMap.get(data.clientId);
      otherClient.socket = data.socket;
      this.clientsCounter++;
    },
    goodbye: () => {
      this.clientsCounter--;
    },
    update: (data) => {
      this.timestemp[0] = Math.max(this.timestemp[0], data.timestemp[0]);
      this.timestemp[0]++;
      const logData = { ...data, clientId: this.id };
      log(logTypes.receivedUpdate, logData);
    },
  };

  handleMessage(data) {
    this.messageTypeHandler[data.type](data);
  }

  async createServer() {
    this.server = new WebSocket.Server({ port: this.portNumber });
    this.server.on("connection", (serverSocket) => {
      serverSocket.on("message", (message) => {
        let data = JSON.parse(message);
        if (data.type === messagesTypes.connection) {
          data = { ...JSON.parse(message), socket: serverSocket };
        }
        this.handleMessage(data);
      });
    });
  }

  async connectToOtherClients() {
    // Create array with all the information about the othere clients
    this.clientsList.forEach((otherClient) => {
      const clientData = otherClient.split(" ");
      const newClient = {
        host: clientData[1],
        port: clientData[2],
        socket: undefined,
      };
      this.clientsMap.set(clientData[0], newClient);
      if (clientData[0] > this.id) {
        this.biggerClients.set(clientData[0], newClient);
      }
    });

    // Connect to clients with bigger id
    this.biggerClients.forEach((value) => {
      const socket = new WebSocket(`ws://localhost:${value.port}`);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            clientId: this.id,
            type: messagesTypes.connection,
          })
        );
        value.socket = socket;
        this.clientsCounter++;
      };

      // Handle recieved data
      socket.onmessage = ({ data }) => {
        const msgData = JSON.parse(data);
        this.handleMessage(msgData);
      };
    });
  }

  sendUpdates(data) {
    const sendData = {
      ...data,
      type: messagesTypes.update,
      timestemp: this.timestemp,
    };
    this.clientsMap.forEach((client) => {
      client.socket.send(JSON.stringify(sendData));
    });
  }

  sendGoodbye() {
    const logData = { clientId: this.id };
    log(logTypes.finishedLocalModifications, logData);
    const sendData = { type: messagesTypes.goodbye, clientId: this.id };
    this.clientsMap.forEach((client, key) => {
      client.socket.send(JSON.stringify(sendData));
    });
    this.saidGoodbye = true;
  }

  exit() {
    const logData = { clientId: this.id };
    log(logTypes.exiting, logData);
    this.server.close();
    this.biggerClients.forEach((client) => {
      client.socket.close();
    });
    console.log(this.str);
  }

  /*********
   * localTasks:
   *
   * 1. insert:
   *    data: {
   *      char: string,
   *      index?: number,
   *    }
   *
   * 2. delete:
   *    data: {
   *      index: number,
   *    }
   *********/

  localTasks = {
    insert: (operationArray) => {
      let newStr = this.str;
      if (operationArray.length === 2) {
        newStr = newStr + operationArray[1];
      } else if (newStr.length > parseInt(operationArray[2])) {
        newStr =
          newStr.substring(0, parseInt(operationArray[2])) +
          operationArray[1] +
          newStr.substring(parseInt(operationArray[2]), newStr.length);
      }

      this.str = newStr;

      this.history.push({
        operation: operationArray.join(" "),
        timestemp: this.timestemp,
        str: newStr,
      });

      // Send update to all the other clients
      this.sendUpdates({
        senderId: this.id,
        operation: operationArray.join(" "),
        updateType: operationArray[0],
        timestemp: this.timestemp,
        str: this.str,
      });
    },
    delete: (operationArray) => {
      let newStr = this.str;
      if (newStr.length > parseInt(operationArray[2])) {
        newStr =
          newStr.substring(0, parseInt(operationArray[1])) +
          newStr.substring(parseInt(operationArray[1]) + 1, newStr.length);
      }

      this.str = newStr;

      this.sendUpdates({
        senderId: this.id,
        operation: operationArray.join(" "),
        updateType: operationArray[0],
        timestemp: this.timestemp,
        str: this.str,
      });
    },
  };

  doTask(operation) {
    // @TODO: Apply one string modification
    const operationArray = operation.split(" ");
    this.localTasks[operationArray[0]](operationArray);
  }

  tasksLoop() {
    setTimeout(() => {
      if (this.stringOperations.length > 0) {
        const task = this.stringOperations.shift();
        this.doTask(task);
        this.tasksLoop();
      } else if (this.stringOperations.length === 0) {
        // If this client finished all his local tasks
        // if this client got "goodbye" from all the other clients
        if (this.clientsCounter === 0) {
          // if he didn't say goodbye
          if (!this.saidGoodbye) {
            this.sendGoodbye();
          }
          this.exit();
        }
        // if this client finished all his local tasks but didn't get "goodbye" from all the other clients
        else {
          if (!this.saidGoodbye) {
            this.sendGoodbye();
          }
          this.tasksLoop();
        }
      }
    }, getRandomInt());
  }

  async startClient() {
    if (this.clientsCounter != this.clientsList.length) {
      // Check if all the sockets are open
      setTimeout(() => this.startClient(), 500);
    } else {
      this.tasksLoop();
    }
  }

  getId() {
    return this.id;
  }

  getPortNumber() {
    return this.portNumber;
  }
};
