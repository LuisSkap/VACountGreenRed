window.onload = function() {
    mostrarCamara();
}

var video;
var canvas;

var altoCamara = 720;
var anchoCamara = 720;

var amarillo = { r: 255, g: 255, b: 0 };
var Lrojo = { r: 255, g: 0, b: 0, a: 255, C: "Rojo", DistA: 120 };
var Lverde = { r: 0, g: 255, b: 0, a: 255, C: "Verde", DistA: 180 };
var Lazul = { r: 0, g: 0, b: 255, a: 255, C: "Azul", DistA: 200 };

//var DA = 180;

var CountRojo = 0;
var CountVerde = 0;

function mostrarCamara() {
  video = document.getElementById("video");
  canvas = document.getElementById("canvas");

//   var opciones = {
//     audio: false,
//     video: {
//       width: anchoCamara,
//       height: altoCamara,
//     },
//   };

//   if (navigator.mediaDevices.getUserMedia) {
//     navigator.mediaDevices
//       .getUserMedia(opciones)
//       .then(function (stream) {
//         video.srcObject = stream;

//         // CountRojo = procesarCamara(Lrojo);

//         setInterval(() => {
//           CountRojo = procesarCamara(Lrojo);
//           CountVerde = procesarCamara(Lverde);

//           var lbCountRojos = document.getElementById("lblCountRojos");
//           var lbCountVerdes = document.getElementById("lblCountVerdes");

//           lbCountRojos.innerHTML = CountRojo;
//           lbCountVerdes.innerHTML = CountVerde;
//         }, 200);
//       })
//       .catch(function (err) {
//         console.log("Oops, hubo un error", err);
//       });
//   } else {
//     console.log("No existe la funcion getUserMedia... oops :( ");
//   }

  "use strict";

    video = require('raspberry-pi-camera-native');

    raspberryPiCamera.on('frame', (frameData) => {
        //Frame Data es un buffer NodeJS
        console.log('Imagen captada', frameData);
        //ConutRojo = procesarCamara(Lrojo);

        setInterval(() => {
            CountRojo = procesarCamara(Lrojo);
            CountVerde = procesarCamara(Lverde);

            var lbCountRojos = document.getElementById("lblCountRojos");
            var lbCountVerdes = document.getElementById("lblCountVerdes");

            lbCountRojos.innerHTML = CountRojo;
            lbCountVerdes.innerHTML = CountVerde;
        }, 200);
    });

    raspberryPiCamera.start({
        width: 1920,
        height: 1080,
        fps: 24,
        encoding: 'JPEG',
        quality: 75
    });
}

function procesarCamara(pick) {
  var ctx = canvas.getContext("2d");

  ctx.drawImage(
    video,
    0,
    0,
    anchoCamara,
    altoCamara,
    0,
    0,
    canvas.width,
    canvas.height
  );

  var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var pixeles = imgData.data;

  var leds = [];

  for (var p = 0; p < pixeles.length; p += 4) {
    var rojo = pixeles[p];
    var verde = pixeles[p + 1];
    var azul = pixeles[p + 2];
    var alpha = pixeles[p + 3];

    var distancia = Math.sqrt(
      Math.pow(pick.r - rojo, 2) +
        Math.pow(pick.g - verde, 2) +
        Math.pow(pick.b - azul, 2)
    );

    if (distancia < pick.DistA) {
      var y = Math.floor(p / 4 / canvas.width);
      var x = (p / 4) % canvas.width;

      if (leds.length == 0) {
        //primer led
        var led = new _Led(x, y);
        leds.push(led);
      } else {
        var encontrado = false;
        for (var pl = 0; pl < leds.length; pl++) {
          if (leds[pl].estaCerca(x, y)) {
            leds[pl].agregarpixel(x, y);
            encontrado = true;
            break;
          }
        }

        if (!encontrado) {
          var ledss = new _Led(x, y);
          leds.push(ledss);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  leds = unirleds(leds);

  for (var pl = 0; pl < leds.length; pl++) {
    var width = leds[pl].xMaxima - leds[pl].xMinima;
    var height = leds[pl].yMaxima - leds[pl].yMinima;

    var area = width * height;

    if (area > 50) {
      leds[pl].dibujar(ctx);
    }
  }

  console.log(pick.C, ": ", leds.length);

  /* setTimeout(() => {
    CountRojo = procesarCamara(Lrojo);
    CountVerde = procesarCamara(Lverde);

    var lbCountRojos = document.getElementById("lblCountRojos");
    var lbCountVerdes = document.getElementById("lblCountVerdes");

    lbCountRojos.innerHTML = CountRojo;
    lbCountVerdes.innerHTML = CountVerde;
  }, 2000); */

  return leds.length;
}

function unirleds(leds) {
  var salir = false;

  //Comparamos todos contra todos
  for (var p1 = 0; p1 < leds.length; p1++) {
    for (var p2 = 0; p2 < leds.length; p2++) {
      if (p1 == p2) continue; //Si es el mismo, no lo consideres, y ya

      var led1 = leds[p1];
      var led2 = leds[p2];

      //Intersectan?
      var intersectan =
        led1.xMinima < led2.xMaxima &&
        led1.xMaxima > led2.xMinima &&
        led1.yMinima < led2.yMaxima &&
        led1.yMaxima > led2.yMinima;

      if (intersectan) {
        //Sip... pasar los pixeles del p2 al p1
        for (var p = 0; p < led2.pixeles.length; p++) {
          led1.agregarpixel(led2.pixeles[p].x, led2.pixeles[p].y);
        }
        //borrar el p2
        leds.splice(p2, 1);
        salir = true;
        break;
      }
    }

    if (salir) {
      break;
    }
  }

  //Si encontre una interseccion, reprocesemos todo de nuevo
  //con el arreglo modificado
  if (salir) {
    return unirleds(leds);
  } else {
    //Ya no hubo intersecciones, salir
    return leds;
  }
}

class _Led  {

	pixeles = [];
	
	xMinima = 0;
	xMaxima = 0;
	yMinima = 0;
	yMaxima = 0;
	
	constructor(x, y)  {
	
		this.agregarpixel(x, y);
		this.xMinima = x;
		this.xMaxima = x;
		this.yMinima = y;
		this.yMaxima = y;
		
		/*console.log("newpixel");
		console.log(x);
		console.log(y);*/
	}
	
	agregarpixel(x, y)  {
		
		this.pixeles.push( {x: x, y: y} );
		
		if(x < this.xMinima)  {
			
			this.xMinima = x;
		}
		if(x > this.xMaxima)  {
			
			this.xMaxima = x
		}
		
		this.yMinima = y < this.yMinima ? y : this.yMinima;
		
		this.yMaxima = y > this.yMaxima ? y : this.yMaxima;
	}
	
	estaCerca(x, y)  {
		
		if(x >= this.xMinima && x <= this.xMaxima && y >= this.yMinima && y <= this.yMaxima)   {
			   
			return true;  
		}
		
		var distx = 0;
		var disty = 0;
		
		if (x < this.xMinima)  {
			
			distx = this.xMinima - x;
		}
		
		if (x > this.xMaxima)   {
			
			distx = x - this.xMaxima;
		}
		
		if (y < this.yMinima)  {
			
			disty = this.yMinima - y;
		}
		
		if (y > this.yMaxima)  {
			
			disty = y - this.yMaxima;
		}
		
		var distanciaabs = distx + disty;
		
		return distanciaabs < 4;
	}
	
	dibujar(ctx)  {
		
		ctx.strokeStyle="#00f";
		ctx.linewidth = 4;
		ctx.beginPath();	
		
		var x = this.xMinima;
		var y = this.yMinima;
		var width = this.xMaxima - this.xMinima;
		var height = this.yMaxima - this.yMinima;
		
		ctx.rect(x, y, width, height)
		
		ctx.stroke();
	}
}
