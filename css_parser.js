/* -------------------------------------------------------------------------- */
// Copyright (C) Nikola Vukićević 2021.
/* -------------------------------------------------------------------------- */

var levi_t  = document.getElementById("levi");
var desni_t = document.getElementById("desni_ispis");


/* STANJE - LEKSER:

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

var MAPA_SIMBOLA = new Map ([
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
	
	["active",  "pseudoklasa"],
	["after",   "pseudoklasa"],
	["before",  "pseudoklasa"],
	["hover",   "pseudoklasa"],
	["root",    "pseudoklasa"],
	["visited", "pseudoklasa"],
]);

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
	
	if(levi_t.value.length > 10000) {
		alert("Unos prevelike količine teksta može znatno usporiti browser!");
	}

	let t1 = performance.now();
	StanjeReset();
	let tokeni    = [];
	let s         = "";
	desni_t.value = "";

	Tokenizacija(stanje, levi_t.value, tokeni);
	Parser(stanje, tokeni);
	s = PripremaHTMLa(tokeni);
	PrebrojavanjeRedova();

	desni_t.innerHTML = s;
	let t2    = performance.now();
	let odziv = (t2 - t1) + "ms";
	document.getElementById("info_aside_tokeni").innerHTML = tokeni.length;
	document.getElementById("info_aside_odziv").innerHTML  = odziv;
}

function Parser(stanje, tokeni) {
	
	let t1    = performance.now();
	let i;

	for (i = 0; i < tokeni.length; i++) {
		
		if(tokeni[i][0] == "whitespace" || tokeni[i][0] == "komentar") {
			continue;
		}

		if(stanje.sledeci != "" && tokeni[i][0] == "token") {
			tokeni[i][0] = stanje.sledeci;
			continue;
		}

		// Ili ova dva, ili da pisem pravi parser :)
		///*

		if(stanje.sledeci == "atribut_vrednost" && tokeni[i][0] == "id_punktuacija") {
			tokeni[i][0] = stanje.sledeci;
		}

		if(stanje.sledeci == "atribut_vrednost" && tokeni[i][0] == "klasa_punktuacija") {
			tokeni[i][0] = stanje.sledeci;
		}

		//*/
						
		switch(tokeni[i][0]) {
			case "et_direktiva_punktuacija":     stanje.sledeci = "et_direktiva";     break;
			case "et_direktiva":                 stanje.sledeci = "et_direktiva";     break;
			case "selektor_zagrada_otvorena":    stanje.sledeci = "atribut_naziv";    break;
			case "zagrada_otvorena":             stanje.sledeci = "atribut_vrednost"; break;
			case "zagrada_zatvorena":            stanje.sledeci = "atribut_vrednost"; break;
			case "zagrada_uglasta_otvorena":     stanje.sledeci = "atribut_vrednost"; break;
			case "zagrada_uglasta_zatvorena":    stanje.sledeci = "atribut_vrednost"; break;
			case "atribut_punktuacija":          stanje.sledeci = "atribut_vrednost"; break;
			case "atribut_vrednost":             stanje.sledeci = "atribut_vrednost"; break;
			case "atribut_vrednost_punktuacija": stanje.sledeci = "atribut_naziv";    break;
			case "navodnik_pocetni":             stanje.sledeci = "niska";            break;
			case "apostrof_pocetni":             stanje.sledeci = "niska";            break;
			case "id_punktuacija":               stanje.sledeci = "id_naziv";         break;
			case "klasa_punktuacija":            stanje.sledeci = "klasa_naziv";      break;
			default: stanje.sledeci = ""; break;
		}
	}

	PretragaTabeleSimbola(stanje, tokeni);

	let t2    = performance.now();
	let odziv = (t2 - t1) + "ms";
	document.getElementById("info_aside_odziv_parser").innerHTML  = odziv;
}

function PretragaTabeleSimbola(stanje, tokeni) {
	let i;

	for (i = 0; i < tokeni.length; i++) {
		if(tokeni[i][0]  == "token") {
			let p = MAPA_SIMBOLA.get(tokeni[i][1]);
			
			if(p) {
				tokeni[i][0] = p;
			}
		}

		if(tokeni[i][0]  == "token" && tokeni[i + 1][0] == "selektori_razdvajanje") {
			tokeni[i][0] = "atribut_vrednost";
		}

		if(tokeni[i][0]  == "token" && tokeni[i + 1][0] == "atribut_vrednost_punktuacija") {
			tokeni[i][0] = "atribut_vrednost";
		}

		if(tokeni[i][0] == "token" && tokeni[i + 1][0] == "klasa_punktuacija" && tokeni[i + 2][0] == "klasa_naziv") {
			tokeni[i][0]     = "atribut_vrednost";
			tokeni[i + 1][0] = "atribut_vrednost";
			tokeni[i + 2][0] = "atribut_vrednost";
			continue;
		}

		if(tokeni[i][0] == "atribut_vrednost" && tokeni[i - 1][0] == "atribut_punktuacija") {
			let p = MAPA_SIMBOLA.get(tokeni[i][1]);
			if(p) {
				tokeni[i][0] = p;
			}
		}
	}
}

function Tokenizacija(stanje, s, tokeni) {

	let t1 = performance.now();

	for (i = 0; i < s.length; i++) {

		switch(s[i]) {

			case '*':  ObradaZnakZvezdica(s[i], tokeni, stanje);                break;
			case '/':  ObradaZnakKosaCrta(s[i], tokeni, stanje);                break;
			case '@':  ObradaZnakManki(s[i], tokeni, stanje);                   break;
			case '.':  ObradaZnakTacka(s[i], tokeni, stanje);                   break;
			case ',':  ObradaZnakZarez(s[i], tokeni, stanje);                   break;
			case '>':  ObradaZnakVece(s[i], tokeni, stanje);                    break;
			case '+':  ObradaZnakPlus(s[i], tokeni, stanje);                    break;
			case '#':  ObradaZnakTaraba(s[i], tokeni, stanje);                  break;
			case ':':  ObradaZnakDveTacke(s[i], tokeni, stanje);                break;
			case ';':  ObradaZnakTackaZarez(s[i], tokeni, stanje);              break;
			case '(':  ObradaZnakOtvorenaZagrada(s[i], tokeni, stanje);         break;
			case ')':  ObradaZnakZatvorenaZagrada(s[i], tokeni, stanje);        break;
			case '[':  ObradaZnakOtvorenaUglastaZagrada(s[i], tokeni, stanje);  break;
			case ']':  ObradaZnakZatvorenaUglastaZagrada(s[i], tokeni, stanje); break;
			case '{':  ObradaZnakOtvorenaViticasta(s[i], tokeni, stanje);       break;
			case '}':  ObradaZnakZatvorenaViticasta(s[i], tokeni, stanje);      break;
			case '=':  ObradaZnakJednako(s[i], tokeni, stanje);                 break;
			case '\"': ObradaZnakNavodnik(s[i], tokeni, stanje);                break;
			case '\'': ObradaZnakApostrof(s[i], tokeni, stanje);                break;
			case ' ':  ObradaZnakRazmak(s[i], tokeni, stanje);                  break;
			case '\t': ObradaZnakTab(s[i], tokeni, stanje);                     break;
			case '\n': ObradaZnakEnter(s[i], tokeni, stanje);                   break;
			default:   ObradaZnakOstali(s[i], tokeni, stanje);                  break;
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

	let t2    = performance.now();
	let odziv = (t2 - t1) + "ms";
	document.getElementById("info_aside_odziv_lekser").innerHTML  = odziv;
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

function ObradaZnakOtvorenaUglastaZagrada(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "zagrada_uglasta_otvorena");
}

function ObradaZnakZatvorenaUglastaZagrada(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "zagrada_uglasta_zatvorena");
}

function ObradaZnakTacka(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "klasa_punktuacija");
}

function ObradaZnakZarez(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "selektori_razdvajanje");
}

function ObradaZnakVece(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "selektori_potomak_veza");
}

function ObradaZnakPlus(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "selektori_povezani_veza");
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

function ObradaZnakJednako(znak, tokeni, stanje) {
	OtkazivanjeKomentara(stanje);
	PovratakNaKomentar(stanje);
	UpisUKomentarIliNisku(znak, stanje);
	UpisSpecijalnogZnaka(znak, tokeni, stanje, "naredba_dodele");
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

		tokeni.push(new Array("apostrof_zavrsni", znak));

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

