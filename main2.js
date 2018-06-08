"use strict";

// polyfill
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(search, pos) {
		return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
	};
}

if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target, firstSource) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

// Testing
function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

var groupIdRegex = /nbianchi-(\d)(?:_(\d))?/;
var bloccoIdRegex = /(\d+(?:\.\d+)?)(?:-(\w+))?/;
var groupsSelector = "#logo > svg > g";
var bianco = 'rgba(255,255,255,0)';
var colori = ["#7ba97d", "#6d7eb0", "#e6b041", "#b61351", "#ca4f24", "#cd8fa5", "#a6ba66", "#585858"];
var transizione = {
	transitionDuration: findGetParameter("transitionDuration") || "50ms,50ms",
	transitionProperty: "fill,stroke",
	transitionTimingFunction: findGetParameter("transitionTimingFunction") ||  "ease-in,ease-in",
	transitionDelay: findGetParameter("transitionDelay") || "200" //ms
};


function decodebloccoId(element, id) {
	var m = undefined;
	id = id.replace(element.id + '-', '');
	if ((m = bloccoIdRegex.exec(id)) !== null) {
		return { id: parseFloat(m[1]), options: [m[2]] };
	}
}

function decodegroupId(id) {
	var m = undefined;
	if ((m = groupIdRegex.exec(id)) !== null) {
		if (m[2]) {
			return [m[1], m[2]];
		} else {
			return [m[1]];
		}
	}
}

function setTransition(blocchi) {
	var colorSorted = [bianco];
	var ind = undefined;
	// intervalloColori
	blocchi.forEach(function (blocco) {
		if (!blocco.colore) return;
		var ind = colorSorted.indexOf(blocco.colore);
		if (ind == -1) {
			colorSorted.push(blocco.colore);
			ind = colorSorted.length - 1;
		}
    blocco.blocco.style.transitionDuration = transizione.transitionDuration;
		blocco.blocco.style.transitionProperty = transizione.transitionProperty;
    blocco.blocco.style.transitionTimingFunction = transizione.transitionTimingFunction;
    blocco.blocco.style.transitionDelay = (ind * transizione.transitionDelay) + "ms";
	});
	console.log(colorSorted)
}

function colora(blocchi) {
	setTimeout(function(){ // Non va messo come delay css, non funziona altrimenti
		blocchi.forEach(function (blocco) {
			blocco.blocco.style.fill = blocco.colore;
			blocco.blocco.style.stroke = blocco.colore;
		});
	}, transizione.transitionDelay );
}

function getBlocchi(element, nbianchi) {

	// Troviamo tutti i blocchi e salviamoli in un dict
	var blocchi = [];
	[].slice.call(element.childNodes).forEach(function (blocco, i) {
		if (blocco.id && blocco.id.startsWith(element.id)) {
			blocchi.push(Object.assign({ blocco: blocco, colore: undefined }, decodebloccoId(element, blocco.id)));
		}
	});

	// Ordiniamo i blochi per id
	blocchi.sort(function (a, b) {
		return a.id > b.id ? 1 : b.id > a.id ? -1 : 0;
	});

	// Quanti blocchi bianchi facciamo per questo pezzo?
	nbianchi = nbianchi[Math.floor(Math.random() * nbianchi.length)];


	// Troviamo i blocchi da colorare in bianco, non devono essere adiacenti
	while (nbianchi != 0) {
		var bloccoId = Math.floor(Math.random() * blocchi.length);
		if (blocchi[bloccoId].options.indexOf("nobianco") != -1) continue;
		if (blocchi[bloccoId].colore == bianco) continue;
		if (bloccoId + 1 in blocchi && blocchi[bloccoId + 1].colore == bianco) continue;
		if (bloccoId - 1 in blocchi && blocchi[bloccoId - 1].colore == bianco) continue;
		blocchi[bloccoId].colore = bianco;
		nbianchi--;
	}

	// Ragruppiamo gli indici dei blocchi continui
	var gruppi = [[]];
	var last = 0;
	blocchi.forEach(function (blocco, ind) {
		if (blocco.colore == bianco) {
			if (gruppi[last].length > 0 && ind != 0 && ind != blocchi.length - 1) {
				gruppi.push([]);
				last++;
			}
		} else {
			gruppi[last].push(ind);
		}
	});

	// Ne estriamo lenght-1 gruppi di blocchi casualmente (uno rimane grigio)
	gruppi = gruppi.slice(0).sort(function () {
		return .5 - Math.random();
	}).slice(0, gruppi.length - 1);

	// Estriamo gruppi.length colori e assegniamo un colore ai blocchi
	var coloriXgruppi = colori.slice(0).sort(function () {
		return .5 - Math.random();
	}).slice(0, gruppi.length);

	gruppi.forEach(function (gruppo, ind) {
		gruppo.forEach(function (bloccoInd) {
			blocchi[bloccoInd].colore = coloriXgruppi[ind];
		});
	});

	return blocchi;
}

function main() {
	var groups = document.querySelectorAll(groupsSelector);
	var blocchi = [];

	[].slice.call(groups).forEach(function (group) {
		var nbianchi = decodegroupId(group.id);
		if (nbianchi) {
			[].slice.call(group.querySelectorAll("g")).forEach(function (element) {
				blocchi = blocchi.concat( getBlocchi(element, nbianchi) );
			});
		}
	});

	setTransition(blocchi);
	colora(blocchi);
}


(function ready(fn) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
    main();
  } else {
    document.addEventListener('DOMContentLoaded', main);
  }
})()

