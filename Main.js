const Client = require("./Client");

async function initilize() {
  const inputFilesPaths = [
    "./Input/input-file-1.txt",
    "./Input/input-file-2.txt",
    "./Input/input-file-3.txt",
  ];

  var fs = require("fs");

  function readInputFile(inputPath) {
    const data = fs.readFileSync(inputPath, "utf-8", function (err, data) {
      return data;
    });

    return data;
  }

  function getList(dataArray) {
    const list = [];

    let str;
    while (str !== "") {
      str = dataArray.shift();
      if (str !== "") {
        list.push(str);
      }
    }
    return list;
  }

  const clientsArray = [];

  inputFilesPaths.forEach((path) => {
    const data = readInputFile(path);
    const dataArray = data.replace(/\r/g, "").split("\n");

    const clientData = {
      clientId: -1,
      portNumber: -1,
      str: "",
      clientsList: [],
      stringOperations: [],
    };

    const clientId = dataArray.shift();
    const portNumber = dataArray.shift();
    const str = dataArray.shift();
    dataArray.shift();

    const clientsList = getList(dataArray);
    const stringOperations = getList(dataArray);

    clientsArray.push(
      new Client(clientId, str, portNumber, clientsList, stringOperations)
    );
  });

  await Promise.all(
    clientsArray.map(async (client) => {
      await client.createServer();
    })
  );

  await Promise.all(
    clientsArray.map(async (client) => {
      await client.connectToOtherClients(client.clientId, client.clientsList);
    })
  );

  clientsArray.forEach((client) => {
    client.startClient();
  });
}

initilize();

// var cl = new Client(1, "", 1234);
// cl.sayHello();
