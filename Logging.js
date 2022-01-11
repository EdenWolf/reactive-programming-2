/*****
 * Log types:
 *
 * 1. logType: "receivedUpdate",
 *    data: {
 *      clientId: number,
 *      senderId: number,
 *      operation: string,
 *      timestemp: [number, number]
 *    }
 *
 * 2. logType: "startedMerging",
 *    data: {
 *      clientId: number,
 *      timestemp: [number, number],
 *      str: string
 *    }
 *
 * 3. logType: "updateOperation",
 *    data: {
 *      operation: string,
 *      timestemp: [number, number],
 *      str: string
 *    }
 *
 * 4. logType: "endedMerging",
 *    data: {
 *      clientId: number,
 *      str: string,
 *      timestemp: [number, number]
 *    }
 *
 * 5. logType: "removedOperation",
 *    data: {
 *      clientId: number,
 *      operation: string,
 *      timestemp: [number, number]
 *    }
 *
 * 6. logType: "finishedLocalModifications",
 *    data: {
 *      clientId: number
 *    }
 *
 * 7. logType: "exiting",
 *    data: {
 *      clientId: number
 *    }
 *
 *****/

const logTypesHandlers = {
  receivedUpdate: (data) =>
    `Client ${data.clientId} received an update operation "${data.operation}", ${data.timestemp[0]}.${data.timestemp[1]} from client ${data.senderId}`,
  startedMerging: (data) =>
    `Client ${data.clientId} started merging, from ${data.timestemp[0]}.${data.timestemp[1]} time stamp, on "${data.str}"`,
  updateOperation: (data) =>
    `operation ${data.operation}, ${data.timestemp[0]}.${data.timestemp[1]}, string: ${data.str}`,
  endedMerging: (data) =>
    `Client ${data.clientId} ended merging with string ${data.str}, on timestamp ${data.timestemp[0]}.${data.timestemp[1]}`,
  removedOperation: (data) =>
    `Client ${data.clientId} removed operation ${data.operation}, ${data.timestemp[0]}.${data.timestemp[1]} from storage`,
  finishedLocalModifications: (data) =>
    `Client ${data.clientId} finished his local string modifications`,
  exiting: (data) => `Client ${data.clientId} is exiting`,
};

module.exports = function log(logType, data) {
  console.log(logTypesHandlers[logType](data));
};
