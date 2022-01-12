const WebSocket = require("ws");
const log = require("./Logging");

const MODE_10 = true;

const messagesTypes = {
  connection: "connection",
  goodbye: "goodbye",
  update: "update",
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
    this.history = [{ operation: "first", timestemp: [0, 0], str: this.str }];
    this.clientsCounter = 0;
    this.biggerClients = new Map();
    this.saidGoodbye = false;
    this.localUpdatesQueue = [];
  }

  isTs1SmallerThanTs2(ts1, ts2) {
    return ts1[0] < ts2[0] || (ts1[0] === ts2[0] && ts1[1] < ts2[1]);
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
      let logData = { ...data, clientId: this.id };
      log(logTypes.receivedUpdate, logData);

      const historyStack = [];

      // put all the newer updates in the queue

      while (
        this.history.length > 1 &&
        this.isTs1SmallerThanTs2(
          data.timestemp,
          this.history[this.history.length - 1].timestemp
        )
      ) {
        historyStack.push(this.history.pop());
      }

      this.str = this.history[this.history.length - 1].str;

      logData = {
        clientId: this.id,
        timestemp:
          this.history.length > 0
            ? this.history[this.history.length - 1].timestemp
            : this.timestemp,
        str: this.str,
      };
      log(logTypes.startedMerging, logData);

      // Do the update we just got
      let operationArray = data.operation.split(" ");
      let newStr = this.localTasks[operationArray[0]](operationArray);

      logData = {
        operation: data.operation,
        timestemp: data.timestemp,
        str: newStr,
      };
      log(logTypes.updateOperation, logData);

      // Put the update we just got in history
      this.history.push({
        operation: data.operation,
        timestemp: data.timestemp,
        str: newStr,
      });

      // Re-apply all the newer operations
      while (historyStack.length > 0) {
        const currantUpdate = historyStack.pop();
        operationArray = currantUpdate.operation.split(" ");
        newStr = this.localTasks[operationArray[0]](operationArray);
        logData = {
          operation: currantUpdate.operation,
          timestemp: currantUpdate.timestemp,
          str: newStr,
        };
        log(logTypes.updateOperation, logData);
        this.history.push({ ...currantUpdate, str: newStr });
      }

      this.timestemp[0] = Math.max(this.timestemp[0], data.timestemp[0]);
      this.timestemp[0]++;

      logData = {
        clientId: this.id,
        str: newStr,
        timestemp: this.timestemp,
      };
      log(logTypes.endedMerging, logData);

      for (let i = 0; i < this.history.length; i++) {
        const tempArr = [];
        const tsClient = this.history[i].timestemp[1];
        for (let j = i + 1; j < this.history.length; j++) {
          if (
            !tempArr.includes(this.history[j].timestemp[1]) &&
            this.history[j].timestemp[1] !== tsClient
          ) {
            tempArr.push(this.history[j].timestemp[1]);
            if (tempArr.length === this.clientsList.length) {
              const removed = this.history.splice(i, 1);
              logData = {
                clientId: this.id,
                operation: removed[0].operation,
                timestemp: removed[0].timestemp,
              };
              log(logTypes.removedOperation, logData);
              i = -1;
              break;
            }
          }
        }
      }
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
    };
    this.localUpdatesQueue.push(sendData);
    if (
      !MODE_10 ||
      this.stringOperations.length === 0 ||
      this.localUpdatesQueue.length >= 10
    ) {
      while (this.localUpdatesQueue.length > 0) {
        const sendMe = this.localUpdatesQueue.shift();
        this.clientsMap.forEach((client) => {
          client.socket.send(JSON.stringify(sendMe));
        });
      }
    }
  }

  sendGoodbye() {
    const logData = { clientId: this.id };
    log(logTypes.finishedLocalModifications, logData);
    const sendData = { type: messagesTypes.goodbye, clientId: this.id };
    this.clientsMap.forEach((client) => {
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
      return newStr;
    },
    delete: (operationArray) => {
      let newStr = this.str;
      if (newStr.length > parseInt(operationArray[2])) {
        newStr =
          newStr.substring(0, parseInt(operationArray[1])) +
          newStr.substring(parseInt(operationArray[1]) + 1, newStr.length);
      }

      this.str = newStr;
      return newStr;
    },
  };

  doTask(operation) {
    // Apply one string modification
    const operationArray = operation.split(" ");
    const newStr = this.localTasks[operationArray[0]](operationArray);

    this.timestemp[0]++;

    this.history.push({
      operation: operationArray.join(" "),
      timestemp: [this.timestemp[0], this.timestemp[1]],
      str: newStr,
    });

    this.sendUpdates({
      senderId: this.id,
      operation: operationArray.join(" "),
      updateType: operationArray[0],
      timestemp: [this.timestemp[0], this.timestemp[1]],
      str: this.str,
    });
  }

  tasksLoop() {
    setTimeout(() => {
      if (this.stringOperations.length > 0) {
        const task = this.stringOperations.shift();
        this.doTask(task);
        this.tasksLoop();
      } else if (this.stringOperations.length === 0) {
        if (this.clientsCounter === 0) {
          if (!this.saidGoodbye) {
            this.sendGoodbye();
          }
          this.exit();
        } else {
          if (!this.saidGoodbye) {
            this.sendGoodbye();
          }
          this.tasksLoop();
        }
      }
    }, 1000);
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
