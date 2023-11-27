const net = require('net');

let socket_port = "2020";

const dgram = require('dgram');

const sockASTX = dgram.createSocket('udp4');

const PORT = 2020;                    
const HOST = '0.0.0.0';

let jsonString = '';

sockASTX.bind(PORT,HOST);
sockASTX.on('listening', () => console.log('Escuchando socket de Asterix'));


sockASTX.on('message', (data) => {
  jsonString = data.toString();
  data="";
 // Buffer.from('');

  // let primeraLlave = jsonString.indexOf("{");
  // let ultimaLlave =jsonString.lastIndexOf("}"); 

  // Dividir la cadena en objetos JSON individuales
  let jsonMatches = jsonString.match(/\{[^}]+\}/g);

  // Eliminar las cadenas JSON procesadas de jsonString
  //jsonString= jsonString.slice( ultimaLlave - primeraLlave + 1);

  //const jsonObj = JSON.parse(jsonMatches);
  postMessage(jsonMatches);

  // if (jsonMatches) {
  //   jsonMatches.forEach((jsonStr) => {
  //     const jsonObj = JSON.parse(jsonStr);
  //     postMessage(jsonObj);
  //   });
  // };
  jsonMatches="";



  
});
/*
const server = net.createServer(socket => {
  console.log('Cliente C++ conectado.');
  
  let jsonString = '';
 
  socket.on('data', data => {     
    
    jsonString += data.toString();
    data="";
   // Buffer.from('');

    let primeraLlave = jsonString.indexOf("{");
    let ultimaLlave =jsonString.lastIndexOf("}"); 

    // Dividir la cadena en objetos JSON individuales
    let jsonMatches = jsonString.match(/\{[^}]+\}/g);

    // Eliminar las cadenas JSON procesadas de jsonString
    jsonString= jsonString.slice( ultimaLlave - primeraLlave + 1);

    postMessage(jsonMatches);

    // if (jsonMatches) {
    //   jsonMatches.forEach((jsonStr) => {
    //     const jsonObj = JSON.parse(jsonStr);
    //     postMessage(jsonObj);
    //   });
    // };
    jsonMatches="";
    
  });    

  socket.on('end', () => {
    console.log('Cliente C++ desconectado.');
  });
});

  server.listen(socket_port, () => {
    console.log('Server listening on port', socket_port);
  });
  */