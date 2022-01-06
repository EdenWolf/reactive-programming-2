function client(id, portNumber, str, clientsList, stringOperations) {
  console.log("ID: " + id);
  console.log("portNumber: " + portNumber);
  console.log("str: " + str);
  console.log("clientsList: " + clientsList);
  console.log("stringOperations: " + stringOperations);

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
