/* -------------------------------------------------------------------------- */
// Copyright (C) Nikola Vukićević 2021.
/* -------------------------------------------------------------------------- */

var levi_t  = document.getElementById("levi");
var desni_t = document.getElementById("desni_ispis");


/* STANJE LEKSER:

	0 - regularno
	1 - zapocet komentar
	2 - linijski komentar
	3 - blok komentar
	4 - zatvaranje blok komentara
	5 - niska između navodnika
	6 - niska između apostrofa
*/

var stanje = {
	s_znakovi   : "",
	s_razmaci   : "",
	sledeci     : "",
	poslednji   : "",
	whitespace  : "",
	niska       : "",
	lekser      : 0,
	br_redova   : 0,
	stek_parser : []
};

Obrada();
levi_t.focus();

function StanjeReset() {
	stanje.s_znakovi   = "";
	stanje.s_razmaci   = "";
	stanje.sledeci     = "";
	stanje.poslednji   = "";
	stanje.whitespace  = "";
	stanje.niska       = "";
	stanje.lekser      = 0;
	stanje.br_redova   = 0;
	stanje.stek_parser = [];
}

function Obrada() {
	let t1 = performance.now();
	StanjeReset();
	let s_l       = levi_t.value;
	let tokeni    = [];
	let s         = "";
	//stanje.stek.push(0);
	desni_t.value = "";

	Tokenizacija(stanje, s_l, tokeni);
	Parser(stanje, tokeni);
	s = PripremaHTMLa(tokeni);
	PrebrojavanjeRedova();

	desni_t.innerHTML = s;
	let t2    = performance.now()
	let odziv = (t2 - t1) + "ms";
	document.getElementById("info_aside_tokeni").innerHTML = tokeni.length;
	document.getElementById("info_aside_odziv").innerHTML  = odziv;
}

function Parser(stanje, tokeni) {
	
	for (i = 0; i < tokeni.length; i++) {
		
		if(tokeni[i][0] == "whitespace" || tokeni[i][0] == "komentar") {
			continue;
		}

		if(stanje.sledeci != "" && tokeni[i][0] == "token") {
			tokeni[i][0] = stanje.sledeci;
		}

		// Ili ova dva, ili da pisem pravi parser :)

		if(stanje.sledeci == "atribut_vrednost" && tokeni[i][0] == "id_punktuacija") {
			tokeni[i][0] = stanje.sledeci;
		}

		if(stanje.sledeci == "atribut_vrednost" && tokeni[i][0] == "klasa_punktuacija") {
			tokeni[i][0] = stanje.sledeci;
		}
						
		switch(tokeni[i][0]) {
			///*
			case "et_direktiva_punktuacija":  stanje.sledeci = "et_direktiva";     break;
			case "et_direktiva":              stanje.sledeci = "et_direktiva";     break;
			case "selektor_zagrada_otvorena": stanje.sledeci = "atribut_naziv";    break;
			case "zagrada_otvorena":          stanje.sledeci = "atribut_vrednost"; break;
			case "zagrada_zatvorena":         stanje.sledeci = "atribut_vrednost"; break;
			case "atribut_punktuacija":       stanje.sledeci = "atribut_vrednost"; break;
			case "atribut_vrednost":          stanje.sledeci = "atribut_vrednost"; break;
			case "navodnik_pocetni":          stanje.sledeci = "niska";            break;
			case "apostrof_pocetni":          stanje.sledeci = "niska";            break;
			case "id_punktuacija":            stanje.sledeci = "id_naziv";         break;
			case "klasa_punktuacija":         stanje.sledeci = "klasa_naziv";      break;
			//*/
			// case "": stanje.sledeci = ""; break;
			// case "": stanje.sledeci = ""; break;
			// case "": stanje.sledeci = ""; break;
			// case "": stanje.sledeci = ""; break;
			// case "": stanje.sledeci = ""; break;
			// case "": stanje.sledeci = ""; break;
			default: stanje.sledeci = ""; break;
		}

			
	}
}

function Tokenizacija(stanje, s, tokeni) {

	for (i = 0; i < s.length; i++) {

		switch(s[i]) {

			case '*':  ObradaZnakZvezdica(s[i], tokeni, stanje);           break;
			case '/':  ObradaZnakKosaCrta(s[i], tokeni, stanje);           break;
			case '@':  ObradaZnakManki(s[i], tokeni, stanje);              break;
			case '.':  ObradaZnakTacka(s[i], tokeni, stanje);              break;
			case '#':  ObradaZnakTaraba(s[i], tokeni, stanje);             break;
			case ':':  ObradaZnakDveTacke(s[i], tokeni, stanje);           break;
			case ';':  ObradaZnakTackaZarez(s[i], tokeni, stanje);         break;
			case '(':  ObradaZnakOtvorenaZagrada(s[i], tokeni, stanje);    break;
			case ')':  ObradaZnakZatvorenaZagrada(s[i], tokeni, stanje);   break;
			case '{':  ObradaZnakOtvorenaViticasta(s[i], tokeni, stanje);  break;
			case '}':  ObradaZnakZatvorenaViticasta(s[i], tokeni, stanje); break;
			case '\"': ObradaZnakNavodnik(s[i], tokeni, stanje);           break;
			case '\'': ObradaZnakApostrof(s[i], tokeni, stanje);           break;
			case ' ':  ObradaZnakRazmak(s[i], tokeni, stanje);             break;
			case '\t': ObradaZnakTab(s[i], tokeni, stanje);                break;
			case '\n': ObradaZnakEnter(s[i], tokeni, stanje);              break;
			default:   ObradaZnakOstali(s[i], tokeni, stanje);             break;
		}
	}

	if(stanje.lekser == 3) {
		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("komentar", stanje.niska));
			stanje.niska = "";
		}
	}

	if(stanje.lekser == 5 || stanje.lekser == 6) {
		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("niska", stanje.niska));
			stanje.niska = "";
		}
	}
}

function PripremaHTMLa(tokeni) {
	let s = "";
	let i;

	for(i = 0; i < tokeni.length; i++) {
		if(tokeni[i][0] == "novi_red") {
			s += `<br><span class='token_${tokeni[i][0]}' title='' onmouseenter='IspisKlase(\"${tokeni[i][0]}\")' onmouseleave='IspisKlase(\"---\")'>${tokeni[i][1]}</span>`;
		}
		else {
			s += `<span class='token_${tokeni[i][0]}' title='' onmouseenter='IspisKlase(\"${tokeni[i][0]}\")' onmouseleave='IspisKlase(\"---\")'>${tokeni[i][1]}</span>`;
		}
	}

	return s;
}

function PrebrojavanjeRedova() {
	stanje.br_redova++;
	let desni_num = document.getElementById("desni_numeracija");
	desni_num.innerHTML = "";

	for (i = 1; i <= stanje.br_redova; i++) {
		desni_num.innerHTML += `<span>${i}</span>`;
	}
}

function ObradaZnakZvezdica(znak, tokeni, stanje) {
	if(stanje.lekser == 1) {
		stanje.lekser = 3;
		stanje.niska += znak;
		return;	
	}

	if(stanje.lekser == 3) {
		stanje.lekser = 4;
		stanje.niska += znak;
		return;
	}

	UpisSpecijalnogZnaka(znak, tokeni, stanje, "globalni");

}

function ObradaZnakKosaCrta(znak, tokeni, stanje) {
	
	if(stanje.lekser == 0) {
		
		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("token", stanje.niska));
			stanje.niska = "";
		}

		stanje.lekser = 1;
		stanje.niska += znak;
		return;
	}

	if(stanje.lekser == 1) {
		stanje.lekser = 2;
		stanje.niska += znak;
		return;
	}

	if(stanje.lekser == 3 || stanje.lekser == 5 || stanje.lekser == 6) {
		stanje.niska += znak;
		return;
	}

	if(stanje.lekser == 4) {
		stanje.lekser = 0;

		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("komentar", stanje.niska + znak));
			stanje.niska = "";
		}
	}
}

function ObradaZnakManki(znak, tokeni, stanje) {
	
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "et_direktiva_punktuacija");
}

function ObradaZnakOtvorenaZagrada(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "zagrada_otvorena");
}

function ObradaZnakZatvorenaZagrada(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "zagrada_zatvorena");
}

function ObradaZnakTacka(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "klasa_punktuacija");
}

function ObradaZnakTaraba(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "id_punktuacija");
}

function ObradaZnakDveTacke(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "atribut_punktuacija");
}

function ObradaZnakTackaZarez(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "atribut_vrednost_punktuacija");
}

function ObradaZnakOtvorenaViticasta(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "selektor_zagrada_otvorena");
}

function ObradaZnakZatvorenaViticasta(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "selektor_zagrada_zatvorena");
}

function ObradaZnakNavodnik(znak, tokeni, stanje) {
	
	if(stanje.lekser == 0) {
		stanje.lekser = 5;
		
		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("token", stanje.niska));
			stanje.niska = "";
		}

		tokeni.push(new Array("navodnik_pocetni", znak));

		return;
	}

	if(stanje.lekser == 1) {
		stanje.lekser = 0;
		stanje.niska += znak;
		return;
	}

	if(stanje.lekser == 4) {
		stanje.lekser = 3;
	}

	if(stanje.lekser == 5) {
		stanje.lekser = 0;

		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("token", stanje.niska));
			stanje.niska = "";
		}

		tokeni.push(new Array("navodnik_zavrsni", znak));

		return;
	}

	if(stanje.lekser == 2 || stanje.lekser == 3 || stanje.lekser == 6) {

		stanje.niska += znak;
		return;
	}

	if(stanje.lekser == 0) {
		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("niska", stanje.niska + znak));
			stanje.niska = "";
		}

		return;
	}
}

function ObradaZnakApostrof(znak, tokeni, stanje) {
	
	if(stanje.lekser == 0) {
		stanje.lekser = 6;

		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("token", stanje.niska));
			stanje.niska = "";
		}

		tokeni.push(new Array("apostrof_pocetni", znak));
		
		return;
	}

	if(stanje.lekser == 1) {
		stanje.lekser = 0;
		stanje.niska += znak;
		return;
	}

	if(stanje.lekser == 4) {
		stanje.lekser = 3;
	}

	if(stanje.lekser == 6) {
		stanje.lekser = 0;

		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("token", stanje.niska));
			stanje.niska = "";
		}

		tokeni.push(new Array("apostrof_pocetni", znak));

		return;
	}

	if(stanje.lekser == 2 || stanje.lekser == 3 || stanje.lekser == 5) {

		stanje.niska += znak;
		return;
	}

	if(stanje.lekser == 0) {
		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("niska", stanje.niska + znak));
			stanje.niska = "";
		}

		return;
	}
}

function ObradaZnakRazmak(znak, tokeni, stanje) {
	
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	
	if(stanje.lekser == 0) {
		
		if(stanje.niska != "") {
			tokeni.push(new Array("token", stanje.niska));
			stanje.niska = "";
		}

		stanje.whitespace += znak;

		return;
	}
}

function ObradaZnakTab(znak, tokeni, stanje) {
	
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	
	if(stanje.lekser == 0) {
		
		if(stanje.niska != "") {
			tokeni.push(new Array("token", stanje.niska));
			stanje.niska = "";
		}

		stanje.whitespace += znak;

		return;
	}
}

function ObradaZnakEnter(znak, tokeni, stanje) {
	
	stanje.br_redova++;

	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	
	if(stanje.lekser == 2) {
		stanje.lekser = 0;
		stanje.niska += znak;

		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("komentar", stanje.niska));
			stanje.niska = "";
		}

		return;
	}

	UpisUKomentarIliNisku(znak, stanje);
	
	if(stanje.lekser == 0) {
		
		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("token", stanje.niska));
			stanje.niska = "";
		}

		stanje.whitespace += znak;

		return;
	}
}

function ObradaZnakOstali(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	
	if(stanje.lekser == 0) {
		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		stanje.niska += znak;

		return;
	}
}

function OtkazivanjeKomentara(stanje) {
	if(stanje.lekser == 1) {
		stanje.lekser = 0;
	}
}

function PovratakNaKomentar(stanja) {
	if(stanje.lekser == 4) {
		stanje.lekser = 3;
	}
}

function UpisUKomentarIliNisku(znak, stanje) {
	if(stanje.lekser == 2 || stanje.lekser == 3 ||
	   stanje.lekser == 5 || stanje.lekser == 6) {

		stanje.niska += znak;
		return;
	}
}

function UpisSpecijalnogZnaka(znak, tokeni, stanje, nazivTokena) {
	if(stanje.lekser == 0) {
		if(stanje.whitespace != "") {
			tokeni.push(new Array("whitespace", stanje.whitespace));
			stanje.whitespace = "";
		}

		if(stanje.niska != "") {
			tokeni.push(new Array("token", stanje.niska));
			stanje.niska = "";
		}

		tokeni.push(new Array(nazivTokena, znak));

		return;
	}
}

function IspisKlase(klasa) {
	document.getElementById("info_aside_klasa").innerHTML = klasa;
}

