const client = require("./Client");

const inputFilesPaths = [
  "./Input/input-file-3.txt",
  "./Input/input-file-2.txt",
  "./Input/input-file-1.txt",
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

for (let i = 0; i < inputFilesPaths.length; i++) {
  const data = readInputFile(inputFilesPaths[i]);
  const dataArray = data.replace(/\r/g, "").split("\n");

  const clientId = dataArray.shift();
  const portNumber = dataArray.shift();
  const str = dataArray.shift();
  dataArray.shift();

  const clientsList = getList(dataArray);
  const stringOperations = getList(dataArray);

  client.startClient(clientId, portNumber, str, clientsList, stringOperations);
}
