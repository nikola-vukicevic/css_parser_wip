# css_syntax_highlighter_wip
Jednostavan highlighter za CSS sintaksu

## Demo

https://www.codeblog.rs/primeri/css_syntax_highlighter/

## Log

#### v1.1.1 (05.05.2021.)

Dodato prepoznavanje blok komentara unutar stringova.

#### v1.1.0 (05.05.2021.)

Optimizovan parser i dodat lekser koji radi preko regex-a, ali, i dalje 'zvanično' koristim DIY tokenizator (dodatnih 250 linija koda; merak nema cenu :D).

#### v1.0.1 (03.05.2021.)

Malko ćemo ipak da se bavimo i parserom, tako da (za sada) ....

Parser proverava nazive svojstava, ali trenutno mapa sadrži samo svojstva koja se vide na demo stranici.

Parser proverava i vrednosti, ali samo vrendnosti sa spiskova (među svojstvima koja su u mapi svojstava).

#### v1.0.0 (03.05.2021.)

Prva verzija sa pravim lekserom (iako ne koristim regularne izraze) i prilično prihvatljivim parserom.

Parser ne proverava nazive svojstava, vrednosti i međusobne veze.

Ne znam da li ću time da se bavim, ali, ko zna .....

#### v0.9.0 (24.04.2021)

I lekser i parser su prilično idiosinkratični (ali funkcionalni). Možda se bacim i na neki pravi CSS parser (ovaj sadašnji nudi samo najosnovniju funkcionalnost), a do tada je sve ovo WIP ....

