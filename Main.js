const client = require("./Client");

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

  const clientDataArray = [];

  for (let i = 0; i < inputFilesPaths.length; i++) {
    const data = readInputFile(inputFilesPaths[i]);
    const dataArray = data.replace(/\r/g, "").split("\n");

    const clientData = {
      clientId: -1,
      portNumber: -1,
      str: "",
      clientsList: [],
      stringOperations: [],
    };

    clientData.clientId = dataArray.shift();
    clientData.portNumber = dataArray.shift();
    clientData.str = dataArray.shift();
    dataArray.shift();

    clientData.clientsList = getList(dataArray);
    clientData.stringOperations = getList(dataArray);

    clientDataArray.push(clientData);
    // client.startClient(clientId, portNumber, str, clientsList, stringOperations);
  }

  for (let i = 0; i < clientDataArray.length; i++) {
    console.log("create server");
    await client.client.createServer(
      clientDataArray[i].clientId,
      clientDataArray[i].portNumber
    );
  }

  for (let i = 0; i < clientDataArray.length; i++) {
    console.log("connect to other clients");
    await client.client.connectToOtherClients(
      clientDataArray[i].clientId,
      clientDataArray[i].clientsList
    );
  }
}

initilize();
