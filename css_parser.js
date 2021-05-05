var t_levi  = document.getElementById("levi");
var t_desni = document.getElementById("desni_ispis");
var PREPOZNAVANJE_SVOJSTAVA_NAZIV    = true;
var PREPOZNAVANJE_SVOJSTAVA_VREDNOST = true;

var WSP  = [' '   ,  '\t' ,  '\n'  ,  '\r'];
	
var SPEC = [
	"."   ,  ","  ,  "@"   ,   "#"  ,   "'",
    "\""  ,  "("  ,  ")"   ,   "["  ,   "]",
    "{"   ,  "}"  ,  ">"   ,   "+"  ,
    ":"   ,  ";"  ,  "="
];

var MAPA_SELEKTORA = new Map ([
	
	/* ------ html selektori ----- */

	["a",           "selektor_html_tag"],
	["article",     "selektor_html_tag"],
	["aside",       "selektor_html_tag"],
	["b",           "selektor_html_tag"],
	["body",        "selektor_html_tag"],
	["button",      "selektor_html_tag"],
	["code",        "selektor_html_tag"],
	["div",         "selektor_html_tag"],
	["figure",      "selektor_html_tag"],
	["figcaption",  "selektor_html_tag"],
	["footer",      "selektor_html_tag"],
	["form",        "selektor_html_tag"],
	["header",      "selektor_html_tag"],
	["h1",          "selektor_html_tag"],
	["h2",          "selektor_html_tag"],
	["h3",          "selektor_html_tag"],
	["h4",          "selektor_html_tag"],
	["h5",          "selektor_html_tag"],
	["h6",          "selektor_html_tag"],
	["i",           "selektor_html_tag"],
	["img",         "selektor_html_tag"],
	["input",       "selektor_html_tag"],
	["label",       "selektor_html_tag"],
	["li",          "selektor_html_tag"],
	["main",        "selektor_html_tag"],
	["nav",         "selektor_html_tag"],
	["ol",          "selektor_html_tag"],
	["p",           "selektor_html_tag"],
	["q",           "selektor_html_tag"],
	["pre",         "selektor_html_tag"],
	["section",     "selektor_html_tag"],
	["span",        "selektor_html_tag"],
	["strong",      "selektor_html_tag"],
	["textarea",    "selektor_html_tag"],
	["u",           "selektor_html_tag"],
	["ul",          "selektor_html_tag"],

	/* ----- @ direktive ----- */

	["import",      "et_direktiva"],
	["media",       "et_direktiva"],
	["font-face",   "et_direktiva"],
	
	/* ----- pseudoklase ----- */
	
	["active",      "pseudoklasa"],
	["after",       "pseudoklasa"],
	["before",      "pseudoklasa"],
	["hover",       "pseudoklasa"],
	["root",        "pseudoklasa"],
	["visited",     "pseudoklasa"],
	["first-child", "pseudoklasa"],
	["last-child",  "pseudoklasa"]

]);

var MAPA_VREDNOSTI = new Map([

	["box-shadow",      ["temp",   []]],
	["color",           ["temp",   []]],
	["display",         ["spisak", ["block", "inline-block", "block", "flex"]]],
	["font-family",     ["temp",   []]],
	["margin",          ["temp",   []]],
	["outline",         ["temp",   []]],
	["padding",         ["temp",   []]],
	["src",             ["temp",   []]],
	["text-decoration", ["temp",   ["none", "underline"]]],

]);

/* -------------------------------------------------------------------------- */
// stek_parser - stanja:
/* -------------------------------------------------------------------------- */

/*

	[0, 0, 0] - osnovni
	[0, 0, 5] - unutrasnost et direktive

	[1, 1, 0] - komentar
	[1, 2, 0] - komentar
	
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

/* -------------------------------------------------------------------------- */
// stek_lekser - stanja:
/* -------------------------------------------------------------------------- */

/*
	
	0 - osnovno
	1 - otvaranje komeentara - stavljena prva kosa crta
	    (ide preko nule)
	2 - započet linijski komentar (skida jedinicu i ide preko nule)
	3 - započet blok komentar (skida jedinicu i ide preko nule)
	4 - zatvaranje blok komentara (stavlja se na 3-ku i skida se ako
	     naleti znak koji nije "/")

	ENTER  - U stanju 2, skida 2-ku 
	'/'    - U stanju 4, skida 4-ku i 3-ku
	OSTALI - U stanju 4, skidaju 4-ku sa steka; u ostalim stanjima -
	         običan upis u komentar

//*/

var STANJE = {
	s_znakovi   : "",
	s_razmaci   : "",
	sledeci     : "",
	prethodni   : "",
	poslednji   : "",
	whitespace  : "",
	komentar    : "",
	niska       : "",
	svojstvo    : "",
	br_redova   : 0,
	stek_niska  : [],
	stek_lekser : [],
	stek_parser : []
};

function StanjeReset() {
	STANJE.s_znakovi   = "";
	STANJE.s_razmaci   = "";
	STANJE.sledeci     = "";
	STANJE.prethodni   = "";
	STANJE.poslednji   = "";
	STANJE.whitespace  = "";
	STANJE.komentar    = "";
	STANJE.niska       = "";
	STANJE.svojstvo    = "";
	STANJE.lekser      = 0;
	STANJE.br_redova   = 0;
	STANJE.stek_niska  = [];
	STANJE.stek_lekser = [];
	STANJE.stek_parser = [];
}

/* -------------------------------------------------------------------------- */
// OBRADA - GLAVNA FUNKCIJA ZA OBRADU I POMOCNE FUNKCIJE KOJE SE NE TIČU
// TOKENIZACIJE i PARSIRANJA:  :
/* -------------------------------------------------------------------------- */

function Obrada() {
	/* ----- telemetrija ------ */
	let t1 = performance.now();

	
	//console.clear();
	StanjeReset();
	STANJE.stek_parser.push([0, 0, 0]);
	t_desni.innerHTML = "";
	let tokeni        = Tokenizacija(STANJE, t_levi.value + "\n");
	tokeni            = Parser(STANJE, tokeni)
	t_desni.innerHTML = PripremaHTMLa(tokeni);
	PrebrojavanjeRedova();


	/* ----- telemetrija ------ */
	let t2    = performance.now();
	let odziv = (t2 - t1) + "ms";
	document.getElementById("info_aside_tokeni").innerHTML = tokeni.length;
	document.getElementById("info_aside_odziv").innerHTML  = odziv;
}

// DEBUG VERZIJA FUNKCIJE JE NA DNU KODA

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

	for (i = 1; i <= STANJE.br_redova; i++) {
		desni_num.innerHTML += `<span>${i}</span>`;
	}
}

function IspisKlase(klasa) {
	document.getElementById("info_aside_klasa").innerHTML = klasa;
}

/* -------------------------------------------------------------------------- */
// TOKENIZACIJA:
/* -------------------------------------------------------------------------- */

function Tokenizacija(stanje, s) {
	let tokeni = [];
	let i;

	STANJE.stek_lekser.push(0);
	
	for(i = 0; i < s.length; i++) {
		
		if(s[i] == '/') {
			TokenizacijaKomentarkosaCrta(s[i], stanje, tokeni);
			continue;
		}

		if(s[i] == '*') {
			TokenizacijaKomentarZvezdica(s[i], stanje, tokeni);
			continue;
		}

		if(WSP.includes(s[i])) {
			TokenizacijaZnakWhitespace(s[i], stanje, tokeni);
			continue;
		}

		if(SPEC.includes(s[i])) {
			TokenizacijaZnakSpecijalni(s[i], stanje, tokeni);
			continue;
		}

		TokenizacijaZnakObican(s[i], stanje, tokeni);
	}

	if(stanje.komentar != "") {
		tokeni.push(stanje.komentar);
		stanje.komentar = "";
	}

	//console.log(t);
	return tokeni;
}

function TokenizacijaKomentarkosaCrta(znak, stanje, tokeni) {

	let kontekst = stanje.stek_lekser[stanje.stek_lekser.length - 1];

	if(kontekst == 0) {

		TokenizacijaPraznjenjeWhitespace(stanje, tokeni);
		TokenizacijaPraznjenjeNiska(stanje, tokeni);
		stanje.stek_lekser.push(1);
		//console.log(stanje.stek_lekser);
		
		return;
	}

	if(kontekst == 1) {

		stanje.stek_lekser.pop();
		stanje.stek_lekser.push(2);
		//console.log(stanje.stek_lekser);
		tokeni.push("//");

		return;
	}

	if(kontekst == 2 || kontekst == 3) {

		TokenizacijaUpisUKomentar(znak, stanje, tokeni);
		//console.log("/ 2 || 3");
		//console.log(stanje.stek_lekser);

		return;
	}

	if(kontekst == 4) {

		tokeni.push(stanje.komentar);
		stanje.komentar = "";
		tokeni.push("*/");
		stanje.stek_lekser.pop();
		stanje.stek_lekser.pop();

		//console.log("/ 4");
		//console.log(stanje.stek_lekser);
		return;
	}
}

function TokenizacijaKomentarZvezdica(znak, stanje, tokeni) {

	let kontekst = stanje.stek_lekser[stanje.stek_lekser.length - 1];

	if(kontekst == 0) {

		TokenizacijaPraznjenjeWhitespace(stanje, tokeni);
		TokenizacijaPraznjenjeNiska(stanje, tokeni);
		
		tokeni.push("*");
		
		return;
	}

	if(kontekst == 1) {
		
		stanje.stek_lekser.pop();
		stanje.stek_lekser.push(3);
		//console.log(stanje.stek_lekser);
		tokeni.push("/*");

		return;
	}

	if(kontekst == 2) {
		
		//console.log("* 2");
		//console.log(stanje.stek_lekser);
		TokenizacijaUpisUKomentar(znak, stanje, tokeni);
		
		return;
	}

	if(kontekst == 3) {
		stanje.stek_lekser.push(4);
		//console.log("push 4");;;
		//console.log(stanje.stek_lekser);
		return;
	}

	if(kontekst == 4) {
		//console.log(stanje.stek_lekser);
		stanje.komentar += znak;
		return;
	}

}

function TokenizacijaZnakWhitespace(znak, stanje, tokeni) {

	let kontekst = stanje.stek_lekser[stanje.stek_lekser.length - 1];

	if(znak == '\n') stanje.br_redova++;

	if(kontekst == 0) {

		TokenizacijaPraznjenjeNiska(stanje, tokeni);
		TokenizacijaPraznjenjeKomentar(stanje, tokeni);

		stanje.whitespace += znak;

		return;
	}

	if(kontekst == 1) {

		TokenizacijaOtkazivanjePocetkaKomentara(znak, stanje, tokeni);

		return;
	}

	if(kontekst == 2 && znak == '\n' ) {

		stanje.stek_lekser.pop();

		//console.log("// ENTER");
		//console.log(stanje.stek_lekser);		
		TokenizacijaPraznjenjeKomentar(stanje, tokeni);
		tokeni.push(znak);
		
		return;
	}

	if(kontekst == 2 || kontekst == 3) {
	
		TokenizacijaUpisUKomentar(znak, stanje, tokeni);

		return;

	}

	if(kontekst == 3) {

		TokenizacijaUpisUKomentar(znak, stanje, tokeni);
		
		return;
	}

	if(kontekst == 4) {

		TokenizacijaOtkazivanjeKrajaBlokKomentara(znak, stanje, tokeni);
		
		return;
	}

}

function TokenizacijaZnakSpecijalni(znak, stanje, tokeni) {

	let kontekst = stanje.stek_lekser[stanje.stek_lekser.length - 1];

	if(kontekst == 0) {

		TokenizacijaPraznjenjeWhitespace(stanje, tokeni);
		TokenizacijaPraznjenjeNiska(stanje, tokeni);

		tokeni.push(znak);

		return;
	}

	if(kontekst == 1) {

		TokenizacijaOtkazivanjePocetkaKomentara(znak, stanje, tokeni);

		return;
	}

	if(kontekst == 2 || kontekst == 3) {

		TokenizacijaUpisUKomentar(znak, stanje, tokeni);

		return;
	}

	if(kontekst == 4) {

		TokenizacijaOtkazivanjeKrajaBlokKomentara(znak, stanje, tokeni);
		
		return;
	}

}

function TokenizacijaZnakObican(znak, stanje, tokeni) {

	let kontekst = stanje.stek_lekser[stanje.stek_lekser.length - 1];

	if(kontekst == 0) {

		// push whitespace-a u listu tokena, ako ima šta
		TokenizacijaPraznjenjeWhitespace(stanje, tokeni);
		// upis znaka u nisku
		stanje.niska += znak;
		return;
	}

	if(kontekst == 1) {

		TokenizacijaOtkazivanjePocetkaKomentara(znak, stanje, tokeni);

		return;
	}

	if(kontekst == 2 || kontekst == 3) {

		TokenizacijaUpisUKomentar(znak, stanje, tokeni);

		return;
	}

	if(kontekst == 4) {

		TokenizacijaOtkazivanjeKrajaBlokKomentara(znak, stanje, tokeni);
		
		return;
	}

}

function TokenizacijaOtkazivanjeKrajaBlokKomentara(znak, stanje, tokeni) {

	stanje.stek_lekser.pop();
	
	stanje.komentar += "*" + znak;
}

function TokenizacijaOtkazivanjePocetkaKomentara(znak, stanje, tokeni) {

	tokeni.push("/");
	stanje.niska += znak;
	stanje.stek_lekser.pop();

	return;
}

function TokenizacijaUpisUKomentar(znak, stanje, tokeni) {
	
	stanje.komentar += znak;
}

function TokenizacijaPraznjenjeWhitespace(stanje, tokeni) {

	if(stanje.whitespace == "") return;

	tokeni.push(stanje.whitespace);
	stanje.whitespace = "";
}

function TokenizacijaPraznjenjeKomentar(stanje, tokeni) {

	if(stanje.komentar == "") return;

	tokeni.push(stanje.komentar);
	stanje.komentar = "";
}

function TokenizacijaPraznjenjeNiska(stanje, tokeni) {

	if(stanje.niska == "") return;

	tokeni.push(stanje.niska);
	stanje.niska = "";
}

/* -------------------------------------------------------------------------- */
// PARSER:
/* -------------------------------------------------------------------------- */

function Parser(stanje, tokeni) {
	/* ----- telemetrija ------ */
	let t1 = performance.now();


	let tokeni_novi = [];

	for(let i = 0; i < tokeni.length; i++) {

		if(tokeni[i] == "") continue;

		let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

		if(kontekst[0] == 1 && tokeni[i] != "*/" && tokeni[i] != "\n") {

			ObradaTokenaKomentar(stanje, tokeni[i], tokeni_novi);
			
			continue;
		}

		if(tokeni[i].startsWith(" ") || tokeni[i].startsWith("\t")) {

			ObradaTokenaWhitespace(stanje, tokeni[i], tokeni_novi);
						
			continue;
		}

		if(tokeni[i].startsWith("\n")) {
			
			ObradaTokenaEnter(stanje, tokeni[i], tokeni_novi);

			continue;
		}

		RazvrstavanjeTokena(stanje, tokeni[i], tokeni_novi);
	}


	/* ----- telemetrija ------ */
	let t2    = performance.now();
	let odziv = (t2 - t1) + "ms";
	document.getElementById("info_aside_odziv_parser").innerHTML  = odziv;


	return tokeni_novi;
}

function RazvrstavanjeTokena(stanje, t, tokeni) {
	
	switch(t) {
		
		case "//": ObradaTokenaKomentarLinijskiOtvaranje(stanje, t, tokeni); break;
		case "/*": ObradaTokenaKomentarBlokOtvaranje(stanje, t, tokeni);     break;
		case "*/": ObradaTokenaKomentarBlokZatvaranje(stanje, t, tokeni);    break;
		case "*":  ObradaTokenaZvezdica(stanje, t, tokeni);                  break;
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
		case ":":  ObradaTokenaDveTacke(stanje, t, tokeni);                  break;
		case ";":  ObradaTokenaTackaZarez(stanje, t, tokeni);                break;
		case "=":  ObradaTokenaJednako(stanje, t, tokeni);                   break;
		
		default:   ObradaTokenaObican(stanje, t, tokeni);                    break;
	}

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

/* -------------------------------------------------------------------------- */
// FUNKCIJE ZA OBRADU POJEDINAČNIH TOKENA:
/* -------------------------------------------------------------------------- */

function ObradaTokenaKomentarLinijskiOtvaranje(stanje, t, tokeni) {

	tokeni.push(new Array("komentar_linijski_otvaranje", t));
	stanje.stek_parser.push([1, 1, 0]);

	return;
}

function ObradaTokenaKomentarBlokOtvaranje(stanje, t, tokeni) {

	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];
	
	tokeni.push(new Array("komentar_blok_otvaranje", t));
	stanje.stek_parser.push([1, 2, 0]);

	return;
}

function ObradaTokenaKomentarBlokZatvaranje(stanje, t, tokeni) {

	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(kontekst[0] == 1) {
		
		tokeni.push(new Array("komentar_blok_zatvaranje", t));
		stanje.stek_parser.pop();
	
	}
	else {
		
		tokeni.push(new Array("greska", t));
	
	}
	
	return;
}

function ObradaTokenaKomentar(stanje, t, tokeni) {

	tokeni.push(new Array("komentar", t));

	return;
}

function ObradaTokenaZvezdica(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni)) return;	
	
	/* ----- Kreiranje globalnog selektora ----- */

	if(kontekst[0] == 0) {
		
		tokeni.push(new Array("globalni", t));
		stanje.stek_parser.push([3, 3, 5]);
		
		return;
	}

	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaTacka(stanje, t, tokeni) {
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
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
	
	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaZarez(stanje, t, tokeni) {
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];
	
	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
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
	
	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaApostrof(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

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

	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaNavodnik(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];
	
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

	tokeni.push(new Array("greska", t));
	
	return;
}

function ObradaTokenaOtvorenaZagrada(stanje, t, tokeni) {
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
	tokeni.push(new Array("zagrada_otvorena", t));
	stanje.stek_parser.push([6, 1, 0]);
	
	return;
}

function ObradaTokenaZatvorenaZagrada(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
	tokeni.push(new Array("zagrada_zatvorena", t));
	stanje.stek_parser.pop();
	
	return;
}

function ObradaTokenaOtvorenaUglastaZagrada(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
	tokeni.push(new Array("zagrada_uglasta_otvorena", t));
	stanje.stek_parser.push([6, 2, 0]);
	
	return;
}

function ObradaTokenaZatvorenaUglastaZagrada(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
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

	if(kontekst[0] == 0 && kontekst[2] == 5) {
		tokeni.push(new Array("selektor_punktuacija_zatvaranje_et", t));
		stanje.stek_parser.pop();
		stanje.stek_parser.pop();
		return;
	}

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
	tokeni.push(new Array("greska", t));	
	
	return;
}

function ObradaTokenaKosaCrta(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni)) return;	
	
	tokeni.push(new Array("greska", t));
	/*
	// DISKUTABILNO - SREDITI DA BUDE SPECIFICNIJE!!!
	tokeni.push(new Array("token", t));	
	*/
	return;
}

function ObradaTokenaObrnutaKosaCrta(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
	// DISKUTABILNO - SREDITI DA BUDE SPECIFICNIJE!!!
	tokeni.push(new Array("token", t));	
	
	return;
}

function ObradaTokenaZnakVece(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
	if(kontekst[0] == 3) {
		// DIKSUTABILNO - TREBA JOS DETALJNIJE - PROVERITI?!
		tokeni.push(new Array("selektor_potomak_veza", t));	
		return;
	}

	tokeni.push(new Array("greska", t));	
	
	return;
}

function ObradaTokenaZnakPlus(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;

	if(kontekst[0] == 3) {
		// DIKSUTABILNO - TREBA JOS DETALJNIJE - PROVERITI?!
		tokeni.push(new Array("selektor_povezivanje", t));	
		return;
	}
		
	tokeni.push(new Array("greska", t));	
	
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
	
	// DISKUTABILNO - MOZE TO SPECIFICNIJE!
	tokeni.push(new Array("token", t));	
	
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
	
	tokeni.push(new Array("greska", t));	
	
	return;
}

function ObradaTokenaJednako(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
	tokeni.push(new Array("token", t));
	
	return;
}

function ObradaTokenaWhitespace(stanje, t, tokeni) {

	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni))    return;	
	
	tokeni.push(new Array("whitespace", t));
	
	return;
}

function ObradaTokenaEnter(stanje, t, tokeni) {
	
	let kontekst = stanje.stek_parser[stanje.stek_parser.length - 1];

	if(UpisUNisku(kontekst, stanje, t, tokeni)) return;	
		
	
	if(kontekst[0] == 1) {

		if(kontekst[1] == 1) {

			
			stanje.stek_parser.pop();
			tokeni.push(new Array("whitespace", t));

			return;
		}
		
		if(kontekst[1] == 2) {

			tokeni.push(new Array("komentar", t));

			return;
		}
	}
	
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
	let p = MAPA_SELEKTORA.get(t);

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

		if(!PREPOZNAVANJE_SVOJSTAVA_NAZIV) {
			
			tokeni.push(new Array("svojstvo_naziv", t));
			return true;
		}

		if(MAPA_VREDNOSTI.get(t)) {
			
			tokeni.push(new Array("svojstvo_naziv", t));
			stanje.svojstvo = t;
			return true;
		}
		else {
			
			tokeni.push(new Array("neprepoznato_svojstvo_naziv", t));
			stanje.svojstvo = "";
			return true;
		}

	}

	if(kontekst[1] == 2) {

		if(!PREPOZNAVANJE_SVOJSTAVA_VREDNOST) {
			
			tokeni.push(new Array("svojstvo_vrednost", t));
			return true;
		}
		
		let p = stanje.svojstvo != "" && MAPA_VREDNOSTI.get(stanje.svojstvo);

		if(p && p[1].includes(t)) {
			
			tokeni.push(new Array("svojstvo_vrednost", t));
			return true;
		}
		else {
			
			tokeni.push(new Array("svojstvo_neprepoznata_vrednost", t));
			return true;
		}
		//*/
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

	if(t == "font-face") {
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

/* -------------------------------------------------------------------------- */
// VISAK (A MOZDA I NIJE .... VIDEĆEMO .....)
/* -------------------------------------------------------------------------- */

function PripremaHTMLa2(tokeni) {
	let s  = "";
	
	// JS format

	/*
	let rb = true;
	let s1 = "[\"";
	let s2 = "\"]\n";
	//*/

	// HTML ispis

	/*
	let rb = false;
	let s1 = "<span>";
	let s2 = "</span>";
	//*/

	// Primitivni ispis

	///*
	let rb = true;
	let s1 = "";
	let s2 = "\n";
	//*/

	for(let i = 0; i < tokeni.length; i++) {
		s += ((rb)? (i+1) + ": " : "") + s1 + tokeni[i] + s2;
		//s += "------------------------------------------------------------\n";
	}

	return s;
}
