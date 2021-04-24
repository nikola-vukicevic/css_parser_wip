/* -------------------------------------------------------------------------------- */
// Copyright (C) 2021. Nikola Vukićević
/* -------------------------------------------------------------------------------- */

var levi_t  = document.getElementById("levi");
var desni_t = document.getElementById("desni");

function f1 (s, s1) {
	s1 = "BLABLA";
}

function Obrada() {
	let i;
	let s_l       = levi_t.value;
	let tokeni    = [];
	desni_t.value = "";
	let s         = "";

	Tokenizacija(s_l, tokeni);
	s = PripremaHTMLa(tokeni);

	desni_t.innerHTML = s;
}

function PripremaHTMLa(tokeni) {
	let s = "";
	let i;

	for(i = 0; i < tokeni.length; i++) {
		s += "<span class='token_" + tokeni[i][0]  + "'>" + tokeni[i][1] + "</span>";
	}

	return s;
}

function Tokenizacija(s, tokeni) {

	let stanje = {
		s_znakovi          : "",
		s_razmaci          : "",
		sledeci            : "",
		kontekst           : 0,
		prethodni_kontekst : 0
	};

	// 0 - van vitišastih zagrada
	// 1 - unutar vitičastih zagrada
	// 2 - otvoren komentar
	// 3 - linijski komentar
	// 4 - blok komentar
	// 5 - zatvaranje blok komentara

	for (i = 0; i < s.length; i++) {
		
		if(s[i] == '*') {
			TokenZvezdica(s[i], tokeni, stanje);
			continue;
		}

		if(s[i] == '@') {
			TokenManki(s[i], tokeni, stanje);
			continue;
		}

		if(s[i] == '.') {
			TokenTacka(s[i], tokeni, stanje);
			continue;
		}

		if(s[i] == '#') {
			TokenTaraba(s[i], tokeni, stanje);
			continue;
		}

		if(s[i] == ':') {
			TokenDveTacke(s[i], tokeni, stanje);
			continue;
		}

		if(s[i] == ';') {
			TokenTackaZarez(s[i], tokeni, stanje);
			continue;
		}

		if(s[i] == '{') {
			TokenOtvorenaViticasta(s[i], tokeni, stanje);
			continue;
		}

		if(s[i] == '}') {
			TokenZatvorenaViticasta(s[i], tokeni, stanje);
			continue;
		}

		if(s[i] == '/') {
			TokenKomentar(s[i], tokeni, stanje);
			continue;
		}

		if(stanje.kontekst == 3 && s[i] == '\n') {
			TokenKomentar(s[i], tokeni, stanje);
			continue;
		}

		if(s[i] == ' ' || s[i] == '\t' || s[i] == '\n') {
			if(stanje.s_znakovi != "") {
				tokeni.push(new Array(stanje.sledeci, stanje.s_znakovi));
				stanje.s_znakovi = "";
			}

			stanje.s_razmaci += s[i];
			continue;
		}


		if(stanje.s_razmaci != "") {
			tokeni.push(new Array("whitespace", stanje.s_razmaci));
			stanje.s_razmaci = "";
		}

		stanje.s_znakovi += s[i];
	}

	//console.log(tokeni);
}

function TokenZvezdica(znak, tokeni, stanje) {
	if(stanje.s_razmaci != "") {
		tokeni.push(new Array("whitespace", stanje.s_razmaci));
		stanje.s_razmaci = "";
	}

	if(stanje.kontekst < 2) {
		if(stanje.s_znakovi != "") {
			tokeni.push(new Array(stanje.sledeci, stanje.s_znakovi));
			stanje.s_znakovi = "";
		}

		tokeni.push(new Array("globalni", znak));
		stanje.sledeci = "";
		return;
	}

	if(stanje.kontekst == 2) {
		stanje.kontekst   = 4;
		stanje.sledeci    = "komentar";
		stanje.s_znakovi += znak;
		return;
	}

	if(stanje.kontekst == 4) {
		stanje.kontekst   = 5;
		stanje.s_znakovi += znak;
		return;
	}
}

function TokenManki(znak, tokeni, stanje) {
	if(stanje.s_razmaci != "") {
		tokeni.push(new Array("whitespace", stanje.s_razmaci));
		stanje.s_razmaci = "";
	}

	if(stanje.s_znakovi != "") {
		tokeni.push(new Array(stanje.sledeci, stanje.s_znakovi));
		stanje.s_znakovi = "";
	}

	tokeni.push(new Array("et_direktiva_punktuacija", znak));
	stanje.sledeci = "et_direktiva";
}

function TokenDveTacke(znak, tokeni, stanje) {
	if(stanje.s_razmaci != "") {
		tokeni.push(new Array("whitespace", stanje.s_razmaci));
		stanje.s_razmaci = "";
	}
	
	if(stanje.s_znakovi != "") {
		tokeni.push(new Array(stanje.sledeci, stanje.s_znakovi));
		stanje.s_znakovi = "";
	}

	tokeni.push(new Array("atribut_punktuacija", znak));
	stanje.sledeci = "atribut_vrednost";
}

function TokenTackaZarez(znak, tokeni, stanje) {
	if(stanje.s_razmaci != "") {
		tokeni.push(new Array("whitespace", stanje.s_razmaci));
		stanje.s_razmaci = "";
	}
	
	if(stanje.s_znakovi != "") {
		tokeni.push(new Array(stanje.sledeci, stanje.s_znakovi));
		stanje.s_znakovi = "";
	}
	
	tokeni.push(new Array("atribut_vrednost_punktuacija", znak));
	stanje.sledeci = "atribut_naziv";
}

function TokenOtvorenaViticasta(znak, tokeni, stanje) {
	stanje.prethodni_kontekst = stanje.kontekst;
	stanje.kontekst           = 1;

	if(stanje.s_razmaci != "") {
		tokeni.push(new Array("whitespace", stanje.s_razmaci));
		stanje.s_razmaci = "";
	}
	
	if(stanje.s_znakovi != "") {
		tokeni.push(new Array(stanje.sledeci, stanje.s_znakovi));
		stanje.s_znakovi = "";
	}
	
	tokeni.push(new Array("selektor_punktuacija_otvarajuci", znak));
	stanje.sledeci = "atribut_naziv";
}

function TokenZatvorenaViticasta(znak, tokeni, stanje) {
	stanje.prethodni_kontekst = stanje.kontekst;
	stanje.kontekst           = 0;

	if(stanje.s_razmaci != "") {
		tokeni.push(new Array("whitespace", stanje.s_razmaci));
		stanje.s_razmaci = "";
	}
	
	tokeni.push(new Array("selektor_punktuacija_zatvarajuci", znak));
	stanje.sledeci = "";

}

function TokenTacka(znak, tokeni, stanje) {
	if(stanje.s_razmaci != "") {
		tokeni.push(new Array("whitespace", stanje.s_razmaci));
		stanje.s_razmaci = "";
	}
		
	if(stanje.kontekst == 0) {
		if(stanje.s_znakovi != "") {
			tokeni.push(new Array(stanje.sledeci, stanje.s_znakovi));
			stanje.s_znakovi = "";
		}

		tokeni.push(new Array("klasa_punktuacija", znak));
		stanje.sledeci = "klasa_naziv";
	}
	else {
		stanje.s_znakovi += znak;
	}
}

function TokenTaraba(znak, tokeni, stanje) {
	if(stanje.s_razmaci != "") {
		tokeni.push(new Array("whitespace", stanje.s_razmaci));
		stanje.s_razmaci = "";
	}

	if(stanje.kontekst == 0) {
		if(stanje.s_znakovi != "") {
			tokeni.push(new Array(stanje.sledeci, stanje.s_znakovi));
			stanje.s_znakovi = "";
		}

		tokeni.push(new Array("id_punktuacija", znak));
		stanje.sledeci = "id_naziv";
	}
	else {
		stanje.s_znakovi += znak;
	}

}

function TokenKomentar(znak, tokeni, stanje) {
	if(stanje.s_razmaci != "") {
		tokeni.push(new Array("whitespace", stanje.s_razmaci));
		stanje.s_razmaci = "";
	}

	if(stanje.kontekst < 2) {
		stanje.kontekst   = 2;
		stanje.s_znakovi += znak;
		return;
	}

	if(stanje.kontekst == 2) {
		stanje.kontekst   = 3;
		stanje.sledeci    = "komentar";
		stanje.s_znakovi += znak;
		return;
	}

	if(stanje.kontekst == 5 || (stanje.kontekst == 3 && znak == '\n')) {
		stanje.kontekst = stanje.prethodni_kontekst;
		tokeni.push(new Array(stanje.sledeci, stanje.s_znakovi + znak));
		stanje.sledeci  = "";
		stanje.s_znakovi = "";
		return;
	}
	
	stanje.s_znakovi += znak;
}
