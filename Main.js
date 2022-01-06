const client = require("./Client");

const inputFilesPaths = [
  "./Input/input-file-1.txt",
  "./Input/input-file-2.txt",
  "./Input/input-file-3.txt",
];

var fs = require("fs");

client.startClient(
  "id",
  "portNumber",
  "str",
  "clientsList",
  "stringOperations"
);

function readInputFile(inputPath) {
  const data = fs.readFileSync(inputPath, "utf-8", function (err, data) {
    return data;
  });
  console.log(data);
}

for (let i = 0; i < inputFilesPaths.length; i++) {
  readInputFile(inputFilesPaths[i]);
}
