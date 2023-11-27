window.ipcRenderer = require('electron').ipcRenderer;
window.ipcMain = require('electron').ipcMain;
window.exec = require('child_process');
window.spawn = require('child_process');
window.shell = require('electron');
window.fs = require('fs');

window.Socket      = require(`${__dirname}/js/Socket.js`);
window.LangProt    = require(`${__dirname}/js/LanguagesProtocol.js`);
window.RadarWidget = require(`${__dirname}/js/RadarWidget.js`);
window.TDClogica   = require(`${__dirname}/js/TDC_logica_v3.js`);
window.SocketUDP   = require(`${__dirname}/js/socketUDP.js`);
window.InputControl = require(`${__dirname}/js/InputControl.js`);