const ipcRenderer = require('electron').ipcRenderer;
const Coordenadas = require('./js/coordenadas.js');

const {
    exec,
    spawn
} = require('child_process');
const {
    Socket,
    dataEmitter
} = require('./js/Socket.js');

const {
    shell
} = require('electron');
const fs = require('fs');

const LangProt = require(`${__dirname}/js/LanguagesProtocol.js`);
const RadarWidget = require(`${__dirname}/js/RadarWidget.js`);
const TDClogica = require(`${__dirname}/js/TDC_logica_v3.js`);
const SocketUDP = require(`${__dirname}/js/socketUDP.js`);
const InputControl = require(`${__dirname}/js/InputControl.js`);
const d3 = require(`${__dirname}/js/d3.v7.js`);

// CONSTANTES
const PC2_IP = "192.168.1.20";

const SERVER = 1;
const CLIENT = 0;

const SYSTEM = process.platform;

const checker_element = document.getElementsByClassName("checker")[0];


/////               NUEVA ESCALA DE COLOR                  /////////////////////////////////////
//LISTA = negro, bordó, rojo, naranja, amarillo, blanco
const LISTA_COLORES = ['#000000', '#800020', '#FF0000', '#FFA500', '#FFFF00', '#FFFFFF'];

const NIVELES = LISTA_COLORES.length; //cantidad de tonalidades o colores en la escala a generar
//Se genera la escala de color según lista de colores y la cantidad de niveles de color 
const ESCALA_COLOR = d3.range(NIVELES).map((d) => d3.interpolateRgbBasis(LISTA_COLORES)(d / (NIVELES - 1)));

////////////////////----------------------//////////////////////////////////////////////////////

// Valores por defecto, las variables seran asignadas despues tomando sus valores desde el archivo
// Las variables del puerto separadas son utiles para depuracion de las dos aplicaciones en una misma computadora
var
    ROLE = undefined,
    DEBUG = false,
    IP_TDC = "",
    PORT_TDC = 0,
    IP_FPGA = "",
    PORT_FPGA = 0,
    MAIN_PC_IP = "",
    PC_PORT = 0,
    PYTHON_PORT = 0,
    MANUAL_FILEPATH = "";

// VARIABLES
var last_msg = {
    "DCL": undefined,
    "AND2": undefined,
    "LPD": undefined,
    "ACK": undefined
};
var $this = this;
var children = undefined;
var check_state = false;

var last_msg_DCL = undefined;

// FUNCIONES GLOBALES
function readFile(filepath) {
    /*
     * Funcion de lectura sincronica de archivos.
     */
    data = fs.readFileSync(filepath, 'utf8');
    return data;
}

// Esta funcion se ejecuta cuando la pagina termina de cargar. 
window.onload = function () {    
    // Cada linea representa el valor de una variable
    let file_content = readFile(`${__dirname}/../.config`);
    file_content = file_content.split("|");

    // CARGO PARAMETROS DESDE LA CONFIGURACION   
    ROLE = file_content[0];
    DEBUG = (file_content[1] === "true");
    IP_TDC = file_content[2];
    PORT_TDC = parseInt(file_content[3]);
    IP_FPGA = file_content[4];
    PORT_FPGA = parseInt(file_content[5]);
    MAIN_PC_IP = file_content[6];
    PC_PORT = parseInt(file_content[7]);
    PYTHON_PORT = parseInt(file_content[8]);
    MANUAL_FILEPATH = file_content[9];


    /////               NUEVOS ATRIBUTOS                     /////////////////////////////////////
    let radar = new RadarWidget(ROLE, 'sintetico');
    radar.angle_points.setAttribute("id", "regla_sintetico");
    radar.radar.setAttribute("id", "sintetico");
    radar.set_listener(); // Esto es del onclick

    //let crudo = new RadarWidget(ROLE,'crudo');

    ////////////////////----------------//////////////////////////////////////////////////////////


    if (ROLE == "main") {

        var socketIO = new Socket(
            "0.0.0.0", // Con esto el socket buscara el puerto abierto para todas las IPs
            PC_PORT, // Aca PC_PORT tiene que ser igual a PYTHON_PORT
            SERVER,
            ["AND1", "AND2", "DCL", "PC2", "FPGA"],
            on_read_callback_server
        );
        var socketPython = socketIO;

        var socket_FPGA_UDP = new SocketUDP(
            SERVER,
            IP_TDC,
            PORT_TDC,
            IP_FPGA,
            PORT_FPGA,
            on_ready_callback_FPGA_UDP,
            on_read_callback_FPGA_UDP
        );
        // Socket UDP con la FPGA
    } else if (ROLE == "pc2") {
        var socketIO = new Socket(
            MAIN_PC_IP,
            PC_PORT,
            CLIENT,
            ["PC2", "FPGA"],
            on_read_callback_client
        );

        var socketPython = new Socket(
            "localhost",
            PYTHON_PORT,
            SERVER,
            ["AND1", "AND2", "DCL"],
            on_read_callback_server
        );

        var socket_FPGA_UDP = socketIO;
    } else {
        // ERROR: Salir
        ;
    }

    let azimutInput = document.getElementById("azimut");
    let distanciaInput = document.getElementById("distancia");
    // Objetos en el DOM
    let azimutInputControl = new InputControl(azimutInput, 0, 359.9, function (value) {
        lp.take_action("procesoCoordenadaCursorEditAzimut(" + value + ")");
    });
    let distanciaInputControl = new InputControl(distanciaInput, 0, 256.0, function (value) {
        lp.take_action("procesoCoordenadaCursorEditRadio(" + value * 256 + ")");
    });

    // Instancias de las clases de control
    var TDC = new TDClogica(radar, azimutInputControl, distanciaInputControl);
    var lp = new LangProt(socketPython, radar);


    //////////////////////////////////////////////////////////////////////////////////////////
    /////                                                /////////////////////////////////////
    /////               NUEVO CÓDIGO                     /////////////////////////////////////
    /////                                                /////////////////////////////////////
    /////                                                /////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////

    const workerSocket = new Worker('./js/wkrSocket.js');


    // PARA PRUEBA DE SINTETICO
    
    /*
    radar.graficar_texto(0,0,"0");    
    radar.graficar_texto(1,1,"1");    
    radar.graficar_texto(2,2,"2");    
    radar.graficar_texto(3,3,"3");    
    radar.graficar_texto(4,4,"4");    
    radar.graficar_texto(5,5,"5");    
    radar.graficar_texto(6,6,"6");    
    radar.graficar_texto(7,7,"7");    
    radar.graficar_texto(8,8,"8");    
    radar.graficar_texto(9,9,"9");    
    radar.graficar_texto(10,10,"10");    
    radar.graficar_texto(11,11,"11");    
    radar.graficar_texto(12,12,"12");     

    radar.graficar_texto(0,15,"NORTE");    
    radar.graficar_texto(15,0,"ESTE");    
    radar.graficar_texto(0,-15,"SUR");    
    radar.graficar_texto(-15,0,"OESTE");

    radar.graficar_linea([0,0],[25,25],"solid");
    radar.graficar_linea([0,-32],[0,32],"solid");

    radar.plot_imagen(0,0,"pdr_fix","png");
    radar.plot_imagen(12,-6,"0001011","png");
    */
    var i = 0;

    workerSocket.onmessage = (event) => {
        graficarPunto(event.data);
    };

    let escala = 32;
    // Canvas visible
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const sintetico = document.getElementById('canvas_sintetico');
    const ctx_sintetico = sintetico.getContext('2d');

    // buffer canvas
    var canvasCrudo = document.createElement('canvas');
    canvasCrudo.width = 16000;
    canvasCrudo.height = 16000;
    var contextCrudo = canvasCrudo.getContext('2d');

    let centroX = 0;
    let centroY = 0;

    let escalaOrigen = [2, 4, 8, 16, 32, 64, 128, 256];
    let escalaTamaño = [1, 1, 1, 1, 1, 6, 6, 6];
    let escalaDestino = [128, 64, 32, 16, 8, 4, 2, 1];
    //let letratam = [3,3,5,10,20,40,80,160];
    
    let centroCanvasX = canvasCrudo.width / 2;
    let centroCanvasY = canvasCrudo.height / 2;

    graficarSintetico(400,400);

    // Método cascara que llama graficar todo lo recibido por el sintético
    // X e Y son las coordenadas que facilitan el descentrado
    function graficarSintetico(x,y){
        ctx_sintetico.clearRect(0, 0, sintetico.width, sintetico.height);
        graficar_textos(x,y);
        graficar_imgs(x,y);
        graficar_lineas(x,y);
        //graficar_pointers(x,y);
        //radar.borrarPuntos();
    }

    function graficar_lineas(x,y){
        let lines = radar.getFormattedLine();
        let puntoA1,puntoA2,puntoB1,puntoB2,tipo_linea;
        lines.forEach((line) =>{
            puntoA1 = escalate(line[0])+x;
            puntoA2 = -escalate(line[1])+y;
            puntoB1 = escalate(line[2])+x;
            puntoB2 = -escalate(line[3])+y;
            tipo_linea = line[4];

            ctx_sintetico.beginPath();
            ctx_sintetico.moveTo(puntoA1,puntoA2);
            ctx_sintetico.lineTo(puntoB1,puntoB2);
            ctx_sintetico.strokeStyle = "white";
            ctx_sintetico.stroke();
            ctx_sintetico.closePath();
        });
    }

    //Escala las coordenadas recibidas desde RadarWdiget
    function escalate(n){
        return n*((sintetico.width/2)/escala);
    }

    /*
    function graficar_pointers(x,y){
        let pointers = radar.getFormattedPointers();
        let pointer_x;
        let pointer_y;
        ctx_sintetico.fillStyle = "green";

        pointers.forEach((pointer) => {
            pointer_x = escalate(pointer[0])+x;
            pointer_y = -escalate(pointer[1])+y;
            ctx_sintetico.fillRect(pointer_x,pointer_y,3,3);
        })
    }*/

    function graficar_imgs(x,y){
        let imgs = radar.getFormattedImg();
        let img_x,img_y;
        let img = new Image();
        //console.table(imgs);
        imgs.forEach((imagen) =>{
            img_x = escalate(imagen[0])+x;
            img_y = -escalate(imagen[1])+y;
            img.src = imagen[2];         
            ctx_sintetico.drawImage(img,
                    img_x-(img.width/2),
                    img_y-(img.height/2));
        })
    }

    function graficar_textos(x,y){
        let textos = radar.getFormattedText();        
        ctx_sintetico.font = "10px serif"
        ctx_sintetico.fillStyle = "white";
        let textData; let text_x; let text_y;
        console.table(textos);
        textos.forEach((text) => {
            textData = text[2];
            text_x =escalate(text[0])+x;  
            text_y =-escalate(text[1])+y;
            ctx_sintetico.textAlign = "start";
            ctx_sintetico.fillText(textData,text_x+15,text_y+8); //15 y 8 colocan el texto en el subindice correcto
        }); 
    }
    
    var data_cant = 0;
    function graficarPunto(data) {
        let x = radar.coordenadas._x;
        let y = radar.coordenadas._y;
        data.forEach((punto) => {
            const puntoJson = JSON.parse(punto);
            let coordX = puntoJson.coordenadaX;
            let coordY = puntoJson.coordenadaY;
            let color = puntoJson.color;
            


            contextCrudo.fillStyle = ESCALA_COLOR[color];
            contextCrudo.fillRect(coordX,coordY,2,2);
        });

        if(data_cant = 500){
            graficarSintetico(x,y);
            data_cant = 0;
        }
        data_cant++;

        escalaActual = radar.escala_DM; // * 4;

        if (escala != escalaActual) {
            
            contextCrudo.clearRect(0, 0, canvasCrudo.width, canvasCrudo.height);
            ctx.clearRect(0, 0, canvas.width, canvas.height);         
            escala = escalaActual;
            graficarSintetico(x,y);
        }
        ctx_sintetico.clearRect(0, 0, sintetico.width, sintetico.height);
        // let distancia = 256 - escala;
        // let distanciaEnPixel = (distancia * (canvasCrudo.width / 2)) / 256;

        // let ancho = escala * 2;
        // let anchoEnPixel = (ancho * (canvasCrudo.width / 2)) / 256;
        // ctx.drawImage(canvasCrudo, distanciaEnPixel, distanciaEnPixel, anchoEnPixel, anchoEnPixel, 0, 0, canvas.width, canvas.height);

        copiarCanvas();
    }

    

    // Crear una instancia de Coordenadas
    let coordenadas = radar.coordenadas;

    // Agregar un observador
    coordenadas.addObserver((x, y) => {
        //console.log(`Las coordenadas han cambiado a: ${x}, ${y}`);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx_sintetico.clearRect(0, 0, sintetico.width, sintetico.height);
        copiarCanvas();
    });
   
    function copiarCanvas() {
        //coordenadas x e y en el canvas de pantalla
        let x = radar.coordenadas._x;
        let y = radar.coordenadas._y;

        //    256 [mn] ---------- radioCanvas [px]
        // escala [mn] ---------- x: escalaEnPixel

        let escalaEnPixel = (escala * (canvasCrudo.width / 2)) / 256;

        // canvasPantalla.width --------- canvasCrudo.width
        //           		  x --------- x: xGrande			  
        let xGrande = (x * canvasCrudo.width) / canvas.width;        
        let yGrande = (y * canvasCrudo.width) / canvas.width;

        let indice = escalaOrigen.indexOf(escala);
        if (xGrande > centroCanvasX) {
            centroX = centroCanvasX - ((xGrande - centroCanvasX) / escalaDestino[indice] );
        }
        if (xGrande < centroCanvasX) {
            centroX = centroCanvasX + ((centroCanvasX - xGrande) / escalaDestino[indice] );
        }
        if (yGrande > centroCanvasX) {
            centroY = centroCanvasY - ((yGrande - centroCanvasY)/ escalaDestino[indice] );
        }
        if (yGrande < centroCanvasX) {
            centroY = centroCanvasY + ((centroCanvasY - yGrande)/ escalaDestino[indice]  );
        }
        if (xGrande == centroCanvasX) {
            centroX = centroCanvasX;
        }
        if (yGrande == centroCanvasY) {
            centroY = centroCanvasY;
        }
        
        let sx;
        sx = centroX - escalaEnPixel;

        let sy;
        sy = centroY - escalaEnPixel;

        if (xGrande == 0 && yGrande == 0) {
            sx = centroCanvasX - escalaEnPixel;
            sy = centroCanvasY - escalaEnPixel;
        }

        let ancho = escala * 2;
        let anchoEnPixel = (ancho * (canvasCrudo.width / 2)) / 256;

        ctx.drawImage(canvasCrudo, sx, sy, anchoEnPixel, anchoEnPixel, 0, 0, canvas.width, canvas.height);
        graficarSintetico(x,y);
    }
   

    // Cambio de escala con los radiobuttons
    let escalaRadioButtons = document.getElementsByName('escala');
    escalaRadioButtons.forEach((radioButton) => {
        radioButton.addEventListener('change', () => {
            let x = radar.coordenadas._x;
            let y = radar.coordenadas._y;

            maxRadio = parseInt(radioButton.value);

            var canvas = document.getElementById('canvas');
            var ct = canvas.getContext('2d');

            var w = canvas.width;
            var h = canvas.height;

            ct.clearRect(0, 0, w, h);
            graficarSintetico(x,y);
        });
    });

    //////////////////////////////////////////////////////////////////////////////////////////
    /////                                                /////////////////////////////////////
    /////               FIN NUEVO CÓDIGO                 /////////////////////////////////////
    /////                                                /////////////////////////////////////
    /////                                                /////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////



    function on_ready_callback_FPGA_UDP() {
        /*
         * Esta funcion es llamada cuando el servidor
         * logra establecerse correctamente.
         */
        var parent_dirname = require('path').resolve(__dirname, '..');
        if (SYSTEM == "win32") {
            var run_python_dirname = `${parent_dirname}/run_python.bat ${parent_dirname}/new-software-tdc`;
            children = spawn('cmd.exe', ['/c', run_python_dirname]);
            children.stdout.on('data', function (data) {
                if (DEBUG) console.log('stdout: ' + data);
            });
            children.stderr.on('data', function (data) {
                if (DEBUG) console.log('stderr: ' + data);
            });
            children.on('exit', function (code) {
                children = undefined;
                if (!DEBUG) ipcRenderer.send("closed");
            });
        } else if (SYSTEM == "linux") {
            var run_python_dirname = `${parent_dirname}/run_python.sh`;
            children = spawn('sh', [run_python_dirname]);
            children.stdout.on('data', function (data) {
                if (DEBUG) console.log('stdout: ' + data);
            });
            children.stderr.on('data', function (data) {
                if (DEBUG) console.log('stderr: ' + data);
            });
            children.on('exit', function (code) {
                children = undefined;
                if (!DEBUG) ipcRenderer.send("closed");
            });
        }
    }

    function on_read_callback_FPGA_UDP(msg) {
        /*
         * Esta funcion es llamada cuando llega un mensaje nuevo de la FPGA.
         */
        msgDecode = TDC.decoderMsg(msg);
        let msgSend = undefined;
        // Variable que almacena el mensaje a enviar

        if (ROLE == "main") {
            if (msgDecode[0] != "AND1") socketIO.send_message(msg, "FPGA");
            // Asi evito que la pc2 procese los mensajes de AND1
        } else {
            // Envio el mensaje completo desde PC2 a main, para que
            // en main, se pueda identificar
            socketIO.send_message(msgDecode, "FPGA");
        }

        if (msgDecode[0] == "AND1" && ROLE == "main") { // envio la informacion de la AND1 a la app de Python

            socketPython.send_message(msgDecode[1], "AND1");
            msgSend = msgDecode[2];

        } else if (msgDecode[0] == "AND2") {

            if (ROLE == "main") {
                msgSend = msgDecode[2];
            } else {
                socketPython.send_message(msgDecode[1], "AND2");
            }

        } else if (msgDecode[0] == "LPD" && msgDecode.length > 1) { // Envio hacia la clase radar la informacion de la LPD

            radar.borrarPuntos();
            if (msgDecode[1].length > 0) { // msg AB1
                radar.set_origen_x_y(msgDecode[1]);
            }
            if (msgDecode[2].length > 0) { // msg AB2
                radar.graficar_markers(msgDecode[2]);
            }
            if (msgDecode[3].length > 0) { // msg AB3
                radar.graficar_cursores(msgDecode[3]);
            }

        } else if (msgDecode[0] == "DCL") { // Envio por UDP la informacion del concentrator a la FPGA

            msgSend = msgDecode[1];

            if (ROLE == "main" && last_msg["DCL"] != undefined) {
                let pc2_msg = last_msg["DCL"][0];
                // Tomo solamente el mensaje decodificado

                msgSend[7] = (pc2_msg[7] & 254) | (msgSend[7] & 3);
                // Superpongo los primeros 5 bits del registro 7 de PC2
                // (corresponde a los botones de centrado). Los bits 1 y 2 no
                // los modifico, mientras que el bit 3 corresponde al data request
                // por lo que mantengo el ultimo estado
                msgSend[10] = pc2_msg[10];
                // Superpongo los valores del elemento 10 que corresponden a la MIK
                // derecha (AND2)
                msgSend[13] = pc2_msg[13];
                // Superpongo los valores del elemento 13 que corresponden al QEK
                // derecho
                msgSend[16] = pc2_msg[16];
                // Superpongo los valores del elemento 16 que corresponde al ICM
                // y Overlay derecho
                msgSend[18] = msgSend[18] & pc2_msg[18];
                msgSend[19] = msgSend[19] & pc2_msg[19];
                // Los elemento 18 y 19 corresponde a la HW.
                // Mantengo el estado de la handwheel segun el
                // ultimo que lo modifico
                msgSend[24] = pc2_msg[24];
                msgSend[25] = pc2_msg[25];
                // Corrijo las coordenadas actuales del rolling derecho con las
                // que recibo de la PC2

                last_msg_DCL = pc2_msg;
            }

        } else if (msgDecode[0] == 'ACK') {
            // Dejo de retrasmitir el DCL
        }

        if (msgSend != undefined && msgSend.length > 0 && ROLE == "main") {
            // TDClogica genera algunos mensajes vacios (pero no de tipo undefined)
            socket_FPGA_UDP.send_message(msgSend, "FPGA");
        }

    }
    // Funciones comunicacion UDP con FPGA

    function on_read_callback_server(msg, namespace) {
        if (namespace == "DCL") {
            TDC.setEstadoCONC(msg);
        } else if (namespace == "PC2") {
            // Recibo desde Python de PC2
            if (msg.split("|")[0] == "panel") {
                socketPython.send_message(msg, "DCL");
            } else if (msg == "CON-ACK") {
                // Conexion verificada
                check_state = true;
            }
        } else if (namespace == "/") {
            if (msg.split("|")[0] == "panel") {
                socketIO.send_message(msg, "PC2");
            } else {
                if (msg == "role") {
                    socketPython.send_message(ROLE);
                } else {
                    lp.take_action(msg);
                }
            }
            /*
            Los mensajes de un boton presionado llegan con el
            prefijo "panel" (haciendo referencia al panel de
            botones)
            */
        }

        if (namespace == "FPGA") {
            // Mensajes recibidos desde la PC2, para FPGA
            last_msg[msg[0]] = msg.slice(1);
        }
    }
    // Funciones server

    function on_read_callback_client(msg, namespace) {
        if (namespace == "FPGA") {
            on_read_callback_FPGA_UDP(msg);
            // Recibo msgDecode desde PC1
        } else if (namespace == "PC2") {
            // Recibo desde Python de PC2
            if (msg.split("|")[0] == "panel") {
                socketPython.send_message(msg, "DCL");
            } else if (msg == "CON-ACK") {
                // Verificacion de conexion, envio devuelta el ACK
                socketIO.send_message("CON-ACK", "PC2");
                check_state = true;
            }
        }
        // Convoco la funcion con el mismo contenido que le llego
        // a la PC main desde la FPGA
    }
    // Funciones cliente

    on_ready_callback_FPGA_UDP();

    on_key = function (event, $this) {
        let keycode = [32, 17, 16, 112, 113, 114, 115, 116, 117, 118, 119, 67, 68, 88, 87];

        let keychar = [
            "space",
            "ctrl_l",
            "shift_l",
            "f1",
            "f2",
            "f3",
            "f4",
            "f5",
            "f6",
            "f7",
            "f8",
            "c",
            "d",
            "x",
            "w"
        ];

        let tecla;

        if (event.which >= 49 && event.which <= 56) { // Numeros del 1 al 8
            if (!azimutInputControl.focused() && !distanciaInputControl.focused()) {
                // Si no se esta escribiendo en los inputs, tomo los numeros
                // como atajos de teclado para los rangos de escala
                tecla = (event.which - 48).toString();
            }
        } else {
            tecla = keychar[keycode.indexOf(event.which)];
        }

        if (tecla) socketPython.send_message("tecla_apretada_mik|" + tecla);
    }
    up_key = function (event, $this) {
        let keycode = [17];
        let keychar = [
            "ctrl_l"
        ];
        let tecla = keychar[keycode.indexOf(event.which)];

        if (tecla) socketPython.send_message("tecla_liberada_mik|" + tecla);
    }
    document.onkeydown = function (event) {
        // Funcion invocada cuando una tecla es presionada
        if (event.which >= 112 && event.which <= 123) // F1 - F12
            event.preventDefault();
        // Para evitar que Electron ejecute los atajos de teclado por defecto

        on_key(event, $this);
    }
    document.onkeyup = function (event) {
        // Funcion invocada cuando la tecla presionada, se suelta
        if (event.which >= 112 && event.which <= 123) // F1 - F12
            event.preventDefault();

        up_key(event, $this);
    }

    let button_to_open_manual = document.getElementsByClassName("open_manual_button")[0];
    button_to_open_manual.addEventListener('click', (event) => {
        if (SYSTEM == "win32" || SYSTEM == "win64") {
            shell.openPath(MANUAL_FILEPATH);
        } else {
            shell.showItemInFolder(MANUAL_FILEPATH);
        }
        // En Windows abre el archivo, en Linux abre la carpeta
        // donde esta el archivo.
    });

    ipcRenderer.on("app-close", _ => {
        if (children) {
            if (SYSTEM == "win32") {
                exec("taskkill /IM 'python.exe' /F");
                exec("taskkill /IM 'pythonw.exe' /F");
            } else if (SYSTEM == "linux") exec("killall python3");
        }
        ipcRenderer.send("closed");
    });

    // Funciones de verificacion de conexion
    setInterval(function () {
        /*
        Verifica la correcta conexion de las dos computadoras periodicamente.
        */
        if (!check_state) {
            if (!checker_element.classList.contains('false')) {
                checker_element.classList.add('false');
                checker_element.classList.remove('true');
            }
        } else {
            if (!checker_element.classList.contains('true')) {
                checker_element.classList.add('true');
                checker_element.classList.remove('false');
            }
        }

        check_state = false;

        if (ROLE == "main") {
            socketIO.send_message("CON-ACK", "PC2");
        }
    }, 500);



    // //// HACER UNA FUNCION GRAL PARA TODOS LOS CHECKS

    // document.getElementById("chkSintetico").addEventListener('change', function() {
    //     if (this.checked) {
    //         document.getElementsByClassName("contenedor_"+this.name)[0].style.display = "block";
    //         //document.getElementById(this.name).style.display = "block";
    //        // document.getElementById('regla'+'_'+this.name).style.display = "block";
    //     } else {
    //         document.getElementsByClassName("contenedor_"+this.name)[0].style.display = "none";
    //         //document.getElementById(this.name).style.display = "none";
    //         //document.getElementById('regla'+'_'+this.name).style.display = "none";
    //     }
    //   });

    //   document.getElementById("chkCrudo").addEventListener('change', function() {
    //     if (this.checked) {
    //         document.getElementsByClassName("contenedor_"+this.name)[0].style.display = "block";
    //         //document.getElementById(this.name).style.display = "block";
    //        // document.getElementById('regla_'+this.name).style.display = "block";
    //     } else {
    //         document.getElementsByClassName("contenedor_"+this.name)[0].style.display = "none";
    //         // document.getElementById(this.name).style.display = "none";
    //         // document.getElementById('regla_'+this.name).style.display = "none";
    //     }
    //   });







};

// FUNCIONES BASICAS