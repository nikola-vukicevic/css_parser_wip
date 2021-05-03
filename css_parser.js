var t_levi  = document.getElementById("levi");
var t_desni = document.getElementById("desni_ispis");

var stanje = {
	s_znakovi   : "",
	s_razmaci   : "",
	sledeci     : "",
	prethodni   : "",
	poslednji   : "",
	whitespace  : "",
	niska       : "",
	br_redova   : 0,
	stek_niska  : [],
	stek_parser : []
};

/* stek_parser - stanja:

[0, 0, 0] - osnovni
[0, 0, 5] - unutrasnost et direktive

[1, 0, 0] - komentar_otvaranje
[1, 1, 0] - komentar_linijski_otvoren
[1, 2, 0] - komentar_blok_otvoren
[1, 3, 0] - komentar_blok_izlazak

[2, 0, 0] - et_naredba
[2, 1, 0] - import
[2, 2, 0] - media
[2, 3, 0] - font-face

[3, 0, 0] - selektor_definicija
[3, 1, 0] - selektor_klasa_otvaranje
[3, 1, 5] - selektor_klasa_otvorena
[3, 2, 0] - selektor_id_otvaranje
[3, 2, 5] - selektor_id_otvorena
[3, 3, 0] - selektor_prepoznati_otvaranje
[3, 3, 5] - selektor_prepoznati_otvoren

[4, 1, 0] - selektor_svojstvo_naziv
[4, 2, 0] - selektor_svojstvo_vrednost

[5, 1, 0] - niska_navodnici
[5, 2, 0] - niska_apostrofi

[6, 1, 0] - otvorena_mala_zagrada
[6, 2, 0] - otvorena_uglasta_zagrada

//*/

var MAPA_SIMBOLA = new Map ([
	/* ------ html selektori ----- */

	["a",          "selektor_html_tag"],
	["article",    "selektor_html_tag"],
	["aside",      "selektor_html_tag"],
	["b",          "selektor_html_tag"],
	["body",       "selektor_html_tag"],
	["button",     "selektor_html_tag"],
	["code",       "selektor_html_tag"],
	["div",        "selektor_html_tag"],
	["figure",     "selektor_html_tag"],
	["figcaption", "selektor_html_tag"],
	["footer",     "selektor_html_tag"],
	["form",       "selektor_html_tag"],
	["header",     "selektor_html_tag"],
	["h1",         "selektor_html_tag"],
	["h2",         "selektor_html_tag"],
	["h3",         "selektor_html_tag"],
	["h4",         "selektor_html_tag"],
	["h5",         "selektor_html_tag"],
	["h6",         "selektor_html_tag"],
	["i",          "selektor_html_tag"],
	["img",        "selektor_html_tag"],
	["input",      "selektor_html_tag"],
	["label",      "selektor_html_tag"],
	["li",         "selektor_html_tag"],
	["main",       "selektor_html_tag"],
	["nav",        "selektor_html_tag"],
	["ol",         "selektor_html_tag"],
	["p",          "selektor_html_tag"],
	["q",          "selektor_html_tag"],
	["pre",        "selektor_html_tag"],
	["section",    "selektor_html_tag"],
	["span",       "selektor_html_tag"],
	["strong",     "selektor_html_tag"],
	["textarea",   "selektor_html_tag"],
	["u",          "selektor_html_tag"],
	["ul",         "selektor_html_tag"],

	/* ----- @ direktive ----- */

	["import",     "et_direktiva"],
	["media",      "et_direktiva"],
	["font-face",  "et_direktiva"],
	
	/* ----- pseudoklase ----- */
	
	["active",     "pseudoklasa"],
	["after",      "pseudoklasa"],
	["before",     "pseudoklasa"],
	["hover",      "pseudoklasa"],
	["root",       "pseudoklasa"],
	["visited",    "pseudoklasa"],
	["first",      "pseudoklasa"],
	["child",      "pseudoklasa"]
]);

function StanjeReset() {
	stanje.s_znakovi   = "";
	stanje.s_razmaci   = "";
	stanje.sledeci     = "";
	stanje.prethodni   = "";
	stanje.poslednji   = "";
	stanje.whitespace  = "";
	stanje.niska       = "";
	stanje.lekser      = 0;
	stanje.br_redova   = 0;
	stanje.stek_niska  = [];
	stanje.stek_parser = [];
}

function Obrada() {
	/* ----- telemetrija ------ */
	let t1 = performance.now();

	
	StanjeReset();
	stanje.stek_parser.push([0, 0, 0]);
	t_desni.innerHTML = "";
	let tokeni = Tokenizacija(stanje, t_levi.value + "\n");
	tokeni = Parser(stanje, tokeni)
	t_desni.innerHTML = PripremaHTMLa(tokeni);
	//alert(stanje.stek_parser);
	PrebrojavanjeRedova();


	/* ----- telemetrija ------ */
	let t2    = performance.now();
	let odziv = (t2 - t1) + "ms";
	document.getElementById("info_aside_tokeni").innerHTML = tokeni.length;
	document.getElementById("info_aside_odziv").innerHTML  = odziv;
}

function Tokenizacija(stanje, s) {
	let t = [];

	let wsp  = [' ', '\t', '\n', '\r'];
	let spec = [".", ",", "@", "#", "'", "\"", "(", ")", "[", "]", "{", "}", "/", ">", "+", "-", ":", ";", "=", "*"];
	
	for(let i = 0; i < s.length; i++) {
		
		//console.log(s[i]);

		if(s[i] == '\n') {
			if(stanje.whitespace != "") {
				t.push(stanje.whitespace);
				stanje.whitespace = "";
			}

			if(stanje.niska != "") {
				t.push(stanje.niska);
				stanje.niska = "";
			}

			t.push(s[i]);
			stanje.br_redova++;

			continue;
		}

		if(wsp.includes(s[i])) {
			if(stanje.niska != "") {
				t.push(stanje.niska);
				stanje.niska = "";
			}

			stanje.whitespace += s[i];

			continue;
		}

		if(spec.includes(s[i])) {
			if(stanje.whitespace != "") {
				t.push(stanje.whitespace);
				stanje.whitespace = "";
			}

			if(stanje.niska != "") {
				t.push(stanje.niska);
				stanje.niska = "";
			}

			t.push(s[i]);
			continue;
		}

		if(stanje.whitespace != "") {
				t.push(stanje.whitespace);
				stanje.whitespace = "";
			}

		stanje.niska += s[i];
	}

	//console.log(t);
	return t;
}

function Parser(stanje, tokeni) {
	/* ----- telemetrija ------ */
	let t1 = performance.now();


	let t_novi = [];

	for(let i = 0; i < tokeni.length; i++) {
		//console.log(stanje.stek_parser);
		if(tokeni[i] == "") continue;

		if(tokeni[i].startsWith(" ") || tokeni[i].startsWith("\t")) {
			
			ObradaTokenaWhitespace(stanje, tokeni[i], t_novi);
			continue;
		}

		if(tokeni[i].startsWith("\n")) {
			
			ObradaTokenaEnter(stanje, tokeni[i], t_novi);
			continue;
		}

		RazvrstavanjeTokena(stanje, tokeni[i], t_novi);
	}


	/* ----- telemetrija ------ */
	let t2    = performance.now();
	let odziv = (t2 - t1) + "ms";
	document.getElementById("info_aside_odziv_parser").innerHTML  = odziv;


	return t_novi;
}

function RazvrstavanjeTokena(stanje, t, tokeni) {
	
	switch(t) {
		
		case ".":  ObradaTokenaTacka(stanje, t, tokeni);                     break;
		case ",":  ObradaTokenaZarez(stanje, t, tokeni);                     break;
		case "@":  ObradaTokenaZnakEt(stanje, t, tokeni);                    break;
		case "#":  ObradaTokenaTaraba(stanje, t, tokeni);                    break;
		case "'":  ObradaTokenaApostrof(stanje, t, tokeni);                  break;
		case "\"": ObradaTokenaNavodnik(stanje, t, tokeni);                  break;
		case "(":  ObradaTokenaOtvorenaZagrada(stanje, t, tokeni);           break;
		case ")":  ObradaTokenaZatvorenaZagrada(stanje, t, tokeni);          break;
		case "[":  ObradaTokenaOtvorenaUglastaZagrada(stanje, t, tokeni);    break;
		case "]":  ObradaTokenaZatvorenaUglastaZagrada(stanje, t, tokeni);   break;
		case "{":  ObradaTokenaOtvorenaViticastaZagrada(stanje, t, tokeni);  break;
		case "}":  ObradaTokenaZatvorenaViticastaZagrada(stanje, t, tokeni); break;
		case "/":  ObradaTokenaKosaCrta(stanje, t, tokeni);                  break;
		case "\\": ObradaTokenaObrnutaKosaCrta(stanje, t, tokeni);           break;
		case ">":  ObradaTokenaZnakVece(stanje, t, tokeni);                  break;
		case "+":  ObradaTokenaZnakPlus(stanje, t, tokeni);                  break;
		case "-":  ObradaTokenaZnakMinus(stanje, t, tokeni);                 break;
		case ":":  ObradaTokenaDveTacke(stanje, t, tokeni);                  break;
		case ";":  ObradaTokenaTackaZarez(stanje, t, tokeni);                break;
		case "=":  ObradaTokenaJednako(stanje, t, tokeni);                   break;
		case "*":  ObradaTokenaZvezdica(stanje, t, tokeni);                  break;
		
		default:   ObradaTokenaObican(stanje, t, tokeni);                    break;
	}

}

function PripremaHTMLa(tokeni) {
	let s  = "";
	
	for(let i = 0; i < tokeni.length; i++) {
		//s += "<span class='token_" + tokeni[i][0] +"'>" + tokeni[i][1] + "</span>";
		s += `<span class='token_${tokeni[i][0]}' title='' onmouseenter='IspisKlase(\"${tokeni[i][0]}\")' onmouseleave='IspisKlase(\"---\")'>${tokeni[i][1]}</span>`;
	}

	return s;
}

function PrebrojavanjeRedova() {
	//stanje.br_redova++;
	let desni_num = document.getElementById("desni_gutter");
	desni_num.innerHTML = "";

	for (i = 1; i <= stanje.br_redova; i++) {
		desni_num.innerHTML += `<span>${i}</span>`;
	}
}

function IspisKlase(klasa) {
	document.getElementById("info_aside_klasa").innerHTML = klasa;
}

/* -------------------------------------------------------------------------- */
// POMOCNE FUNKCIJE ZA OBRADU TOKENA:
/* -------------------------------------------------------------------------- */

function UpisUNisku(kontekst, stanje, t, tokeni) {
	
	if(kontekst[0] == 5) {
		tokeni.push(new Array("niska", t));
		return true;
	}

	return false;
}

function UpisUKomentar(kontekst, stanje, t, tokeni) {

	if(kontekst[0] != 1) return false;

	if(kontekst[1] == 1 || kontekst[1] == 2) {
		
		tokeni.push(new Array("komentar", t));
		return true;
	}
	
	if(kontekst[1] == 3) {

		tokeni.push(new Array("komentar", stanje.stek_niska.pop() + t));
		stanje.stek_parser.pop();
		return true;
	}
	
	return false;
}

function ObradaKomentar(kontekst, stanje, t, tokeni) {

	if(kontekst[0] != 1) return false;

	if(t == "/") {
		
		if(ObradaKomentarZnakKosaCrta(kontekst, stanje, t, tokeni)) return true;
	}

	if(t == "*") {
		
		if(ObradaKomentarZnakZvezdica(kontekst, stanje, t, tokeni)) return true;
		
	}

	// Ne mora da se proverava uslov, jer ENTER zavrsi ovde samo
	// preko uslova u funkciji za obradu ENTERa

	if(t.startsWith("\n")) {
		ObradaKomentarZnakEnter(kontekst, stanje, t, tokeni);
		return true;
	}

	if(kontekst[1] == 3) {
		tokeni.push(new Array("komentar", stanje.stek_niska.pop()));
		return true;
	}

	tokeni.push(new Array("greska", stanje.stek_niska.pop()));
	stanje.stek_parser.pop();
	
	return true;
}

/* -------------------------------------------------------------------------- */
// FUNKCIJE ZA OBRADU POJEDINAČNIH TOKENA:
/* -------------------------------------------------------------------------- */

function ObradaKomentarZnakKosaCrta(kontekst, stanje, t, tokeni) {

	if( kontekst[1] == 0) {
		tokeni.push(new Array("komentar_linijski_otvaranje", stanje.stek_niska.pop() + t));
		stanje.stek_parser.pop();
		stanje.stek_parser.push([1, 1, 0]);
		return true;
	}

	if(kontekst[1] == 3) {
		tokeni.push(new Array("komentar_blok_zatvaranje", stanje.stek_niska.pop() + t));
		stanje.stek_parser.pop();
		stanje.stek_parser.pop();
		return true;
	}

	return false;
}

function ObradaKomentarZnakZvezdica(kontekst, stanje, t, tokeni) {

	if(kontekst[1] == 0) {
		tokeni.push(new Array("komentar_blok_otvaranje", stanje.stek_niska.pop() + t));
		stanje.stek_parser.pop();
		stanje.stek_parser.push([1, 2, 0]);
		return true;
	}
	
	if(kontekst[1] == 2) {
		stanje.stek_niska.push(t);
		stanje.stek_parser.push([1, 3, 0]);
		return true;
	}

	if(kontekst[1] == 3) {
		tokeni.push(new Array("komentar", stanje.stek_niska.pop()));
		stanje.stek_niska.push(t);
		return true;
	}

	return false;
}

function ObradaKomentarZnakEnter(kontekst, stanje, t, tokeni) {
	
	tokeni.push(new Array("whitespace", t));
	stanje.stek_parser.pop();
}

function ObradaTokenaKosaCrta(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni)) return;	
	
	if(kontekst[0] != 1) {
		stanje.stek_niska.push(t);
		stanje.stek_parser.push([1, 0, 0]);
		return;
	}

	if(kontekst[0] == 1) {
		if(kontekst[1] == 1 || kontekst[1] == 2) {
			tokeni.push(new Array("komentar", t));
			return;
		}
		else { // inace je 5
			ObradaKomentar(kontekst, stanje, t, tokeni);
			return;
		}
	}

	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaZvezdica(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni)) return;	
	
	/* ----- Upis u linijski ----- */

	if(kontekst[0] == 1 && (kontekst[1] == 1)) {
		tokeni.push(new Array("komentar", t));
		return;
	}
	
	/* ----- Kreiranje globalnog selektora ----- */

	if(kontekst[0] == 0) {
		tokeni.push(new Array("globalni", t));
		stanje.stek_parser.push([3, 3, 5]);
		return;
	}

	if(kontekst[0] == 1) {
		ObradaKomentar(kontekst, stanje, t, tokeni);
		return;
	}

	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaTacka(stanje, t, tokeni) {
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	if(kontekst[0] == 0) {
		tokeni.push(new Array("klasa_punktuacija", t));
		stanje.stek_parser.push([3, 1, 0]);
		return;
	}

	if(kontekst[0] == 3) {
		tokeni.push(new Array("klasa_punktuacija", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.push([3, 1, 0]);
		return;
	}

	if(kontekst[0] == 4 && kontekst[1] == 2) {
		tokeni.push(new Array("svojstvo_vrednost", t));
		return;
	}

	if(kontekst[0] == 6) {
		tokeni.push(new Array("vrednost_u_zagradi", t));
		return;
	}
	
	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaZarez(stanje, t, tokeni) {
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];
	
	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	if(kontekst[0] == 3) {
		tokeni.push(new Array("selektori_razdvajanje", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.push([3, 0, 0]);
		return;
	}

	if(kontekst[0] == 4 && kontekst[1] == 2) {
		tokeni.push(new Array("svojstvo_vrednost", t));
		return;
	}

	if(kontekst[0] == 6) {
		tokeni.push(new Array("vrednost_u_zagradi", t));
		return;
	}

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaZnakEt(stanje, t, tokeni) {
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];
	
	if(kontekst[0] == 0) {
		tokeni.push(new Array("et_direktiva_punktuacija", t));
		stanje.stek_parser.push([2, 0, 0]);
		return;
	}

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaTaraba(stanje, t, tokeni) {
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];
	
	if(kontekst[0] == 0) {
		tokeni.push(new Array("id_punktuacija", t));
		stanje.stek_parser.push([3, 2, 0]);
		return;
	}

	if(kontekst[0] == 3) {
		tokeni.push(new Array("id_punktuacija", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.push([3, 2, 0]);
		return;
	}

	if(kontekst[0] == 4 && kontekst[1] == 2) {
		tokeni.push(new Array("svojstvo_vrednost", t));
		return;
	}

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaApostrof(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;
	
	if(kontekst[0] != 5) {
		tokeni.push(new Array("apostrof_pocetni", t));
		stanje.stek_parser.push([5, 2, 0]);
		return;
	}

	if(kontekst[0] == 5 && kontekst[1] == 2) {
		stanje.stek_parser.pop();
		tokeni.push(new Array("apostrof_zavrsni", t));
		return;
	}

	if(kontekst[0] == 5 && kontekst[1] == 1) {
		tokeni.push(new Array("niska", t));
		return;
	}


	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaNavodnik(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];
	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	if(kontekst[0] != 5) {
		tokeni.push(new Array("navodnik_pocetni", t));
		stanje.stek_parser.push([5, 1, 0]);
		return;
	}

	if(kontekst[0] == 5 && kontekst[1] == 1) {
		stanje.stek_parser.pop();
		tokeni.push(new Array("navodnik_zavrsni", t));
		return;
	}

	if(kontekst[0] == 5 && kontekst[1] == 2) {
		tokeni.push(new Array("niska", t));
		return;
	}

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaOtvorenaZagrada(stanje, t, tokeni) {
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("zagrada_otvorena", t));
	stanje.stek_parser.push([6, 1, 0]);
	
	return;
}

function ObradaTokenaZatvorenaZagrada(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("zagrada_zatvorena", t));
	stanje.stek_parser.pop();
	
	return;
}

function ObradaTokenaOtvorenaUglastaZagrada(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("zagrada_uglasta_otvorena", t));
	stanje.stek_parser.push([6, 2, 0]);
	
	return;
}

function ObradaTokenaZatvorenaUglastaZagrada(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("token", t));
	stanje.stek_parser.pop();
	
	return;
}

function ObradaTokenaOtvorenaViticastaZagrada(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(kontekst[0] == 3 || (kontekst[0] == 2 && kontekst[1] != 2)) {
		tokeni.push(new Array("selektor_punktuacija_otvaranje", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.push([4, 1, 0]);
		return;
	}

	// DISKUTABILNO?!?!

	if(kontekst[0] == 2) {
		tokeni.push(new Array("selektor_punktuacija_otvaranje_et", t));
		stanje.stek_parser.push([0, 0, 5]);
		return;
	}

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("greska", t));	
	
	return;
}

function ObradaTokenaZatvorenaViticastaZagrada(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(kontekst[0] == 4) {
		tokeni.push(new Array("selektor_punktuacija_zatvaranje", t));
		stanje.stek_parser.pop();
		return;
	}

	// DISKUTABILNO?!?!

	/*if(kontekst[0] == 2) {
		tokeni.push(new Array("selektor_punktuacija_zatvaranje_et", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.pop();
		// Zašto ne radi bez ovog drugog pop-a?
		return;
	}*/

	if(kontekst[0] == 0 && kontekst[2] == 5) {
		tokeni.push(new Array("selektor_punktuacija_zatvaranje_et", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.pop();
		return;
	}

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("greska", t));	
	
	return;
}

function ObradaTokenaObrnutaKosaCrta(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("token", t));	
	
	return;
}

function ObradaTokenaZnakVece(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("selektor_potomak_veza", t));	
	
	return;
}

function ObradaTokenaZnakPlus(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;	
	
	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("token", t));	
	
	return;
}

function ObradaTokenaZnakMinus(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;
	
	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("token", t));	
	
	return;
}

function ObradaTokenaDveTacke(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(kontekst[0] == 4) {
		if(kontekst[1]  == 1) {
			tokeni.push(new Array("svojstvo_punktuacija", t));
			stanje.stek_parser.pop();
			stanje.stek_parser.push([4, 2, 0]);
			return;
		}
	}

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("atribut_punktuacija", t));	
	
	return;
}

function ObradaTokenaTackaZarez(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(kontekst[0] == 4) {
		if(kontekst[1]  == 2) {
			tokeni.push(new Array("svojstvo_vrednost_punktuacija", t));
			stanje.stek_parser.pop();
			stanje.stek_parser.push([4, 1, 0]);
			return;
		}
	}

	if(kontekst[0] == 2 && kontekst[1] == 1) {
		tokeni.push(new Array("et_naredba_punktuacija_zavrsni", t));
		stanje.stek_parser.pop();
		return;
	}

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("token", t));	
	
	return;
}

function ObradaTokenaJednako(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("token", t));
	
	return;
}

function ObradaTokenaWhitespace(stanje, t, tokeni) {

	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	if(kontekst[0] == 1) {
		ObradaKomentar(kontekst, stanje, t, tokeni);
		return;
	}
	
	tokeni.push(new Array("whitespace", t));
	
	return;
}

function ObradaTokenaEnter(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(kontekst[0] == 1 && kontekst[1] == 1) {
		ObradaKomentar(kontekst, stanje, t, tokeni);
		return;
	}

	if(UpisUNisku(kontekst, stanje, t, tokeni)) return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	tokeni.push(new Array("whitespace", t));
	
	return;
}

function ObradaTokenaObican(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	/* ----- Klasa naziv ----- */
	
	if(kontekst[0] == 3 && kontekst[1] == 1 && kontekst[2] == 0) {
		ObradaTokenObicanKlasa(kontekst, stanje, t, tokeni);
		return;
	}

	/* ----- Id naziv ----- */
	
	if(kontekst[0] == 3 && kontekst[1] == 2 && kontekst[2] == 0) {
		ObradaTokenObicanId(kontekst, stanje, t, tokeni);
		return;
	}

	/* ----- HTML selektori ----- */
	
	if(kontekst[0] == 0 || kontekst[0] == 3) {
		if(ObradaTokenObicanHTMLSelektor(kontekst, stanje, t, tokeni)) return;
	}

	/* ----- Svojstva selektora ----- */

	if(kontekst[0] == 4) {
		if(ObradaTokenObicanSvojstvaSelektora(kontekst, stanje, t, tokeni)) return;
	}

	/* ----- @ direktive ----- */

	if(kontekst[0] == 2) {
		if(ObradaTokenObicanEtDirektiva(kontekst, stanje, t, tokeni)) return;
	}

	/* ------ Tokeni unutar zagrada ----- */

	if(kontekst[0] == 6) {
		ObradaTokenObicanUnutarZagrada(kontekst, stanje, t, tokeni);
		return;
	}

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	if(UpisUKomentar(kontekst, stanje, t, tokeni)) return;

	ObradaKomentar(kontekst, stanje, t, tokeni);
	tokeni.push(new Array("greska", t));
	return;
}

function ObradaTokenObicanKlasa(kontekst, stanje, t, tokeni) {
	tokeni.push(new Array("klasa_naziv", t));
	stanje.stek_parser.pop();
	stanje.stek_parser.push([3, 1, 5]);
}

function ObradaTokenObicanId(kontekst, stanje, t, tokeni) {
	tokeni.push(new Array("id_naziv", t));
	stanje.stek_parser.pop();
	stanje.stek_parser.push([3, 2, 5]);
}

function ObradaTokenObicanHTMLSelektor(kontekst, stanje, t, tokeni) {
	let p = MAPA_SIMBOLA.get(t);

	if(p) {
		tokeni.push(new Array(p, t));
		if(kontekst[0] == 3) stanje.stek_parser.pop();
		stanje.stek_parser.push([3, 3, 5]);
		return true;
	}

	return false;
}

function ObradaTokenObicanSvojstvaSelektora(kontekst, stanje, t, tokeni) {
	if(kontekst[1] == 1) {
		tokeni.push(new Array("svojstvo_naziv", t));
		return true;
	}

	if(kontekst[1] == 2) {
		tokeni.push(new Array("svojstvo_vrednost", t));
		return true;
	}

	return false;
}

function ObradaTokenObicanEtDirektiva(kontekst, stanje, t, tokeni) {
	if(t == "import") {
		tokeni.push(new Array("et_direktiva", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.push([2, 1, 0]);
		return true;
	}

	if(t == "media") {
		tokeni.push(new Array("et_direktiva", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.push([2, 2, 0]);
		return true;
	}

	if(t == "font") {
		tokeni.push(new Array("et_direktiva", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.push([2, 3, 0]);
		return true;
	}

	/*
		Ovo već nema veze sa pravim parsiranjem, ali,
		neka ostane za sada ....
	*/

	if(kontekst[1] > 0) {
		tokeni.push(new Array("et_direktiva", t));
		return true;
	}
}
function ObradaTokenObicanUnutarZagrada(kontekst, stanje, t, tokeni) {
	tokeni.push(new Array("vrednost_u_zagradi", t));
}
