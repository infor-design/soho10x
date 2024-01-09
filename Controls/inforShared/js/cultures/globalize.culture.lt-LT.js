/*
 * Globalize Culture lt-LT
 *
 * http://github.com/jquery/globalize
 *
 * Copyright Software Freedom Conservancy, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * This file was generated by the Globalize Culture Generator
 * Translation: bugs found in this file need to be fixed in the generator
 */

(function( window, undefined ) {

var Globalize;

if ( typeof require !== "undefined"
	&& typeof exports !== "undefined"
	&& typeof module !== "undefined" ) {
	// Assume CommonJS
	Globalize = require( "globalize" );
} else {
	// Global variable
	Globalize = window.Globalize;
}

Globalize.addCultureInfo( "lt-LT", "default", {
	name: "lt-LT",
	englishName: "Lithuanian (Lithuania)",
	nativeName: "lietuvių (Lietuva)",
	language: "lt",
	numberFormat: {
		",": ".",
		".": ",",
		negativeInfinity: "-begalybė",
		positiveInfinity: "begalybė",
		percent: {
			pattern: ["-n%","n%"],
			",": ".",
			".": ","
		},
		currency: {
			pattern: ["-n $","n $"],
			",": ".",
			".": ",",
			symbol: "Lt"
		}
	},
	calendars: {
		standard: {
			"/": ".",
			firstDay: 1,
			days: {
				names: ["sekmadienis","pirmadienis","antradienis","trečiadienis","ketvirtadienis","penktadienis","šeštadienis"],
				namesAbbr: ["Sk","Pr","An","Tr","Kt","Pn","Št"],
				namesShort: ["S","P","A","T","K","Pn","Š"]
			},
			months: {
				names: ["sausis","vasaris","kovas","balandis","gegužė","birželis","liepa","rugpjūtis","rugsėjis","spalis","lapkritis","gruodis",""],
				namesAbbr: ["Sau","Vas","Kov","Bal","Geg","Bir","Lie","Rgp","Rgs","Spl","Lap","Grd",""]
			},
			monthsGenitive: {
				names: ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio",""],
				namesAbbr: ["Sau","Vas","Kov","Bal","Geg","Bir","Lie","Rgp","Rgs","Spl","Lap","Grd",""]
			},
			AM: null,
			PM: null,
			patterns: {
				d: "yyyy.MM.dd",
				D: "yyyy 'm.' MMMM d 'd.'",
				t: "HH:mm",
				T: "HH:mm:ss",
				f: "yyyy 'm.' MMMM d 'd.' HH:mm",
				F: "yyyy 'm.' MMMM d 'd.' HH:mm:ss",
				M: "MMMM d 'd.'",
				Y: "yyyy 'm.' MMMM"
			}
		}
	},
  messages: {"AdditionalHelp":"Papildomas žinynas","AddNewTab":"Pridėti naują skirtuką","Alerts":"Įspėjimai","ApplyFilter":"Taikyti filtrą","Approve":"Patvirtinti","Attachments":"Priedai","Back":"Atgal","Basic":"Pagrindinis","Between":"Tarp","Book":"Užsakyti","Cancel":"Atšaukti","Checked":"Pažymėta","ClearFilter":"Valyti filtrą","Close":"Uždaryti","CloseCancelChanges":"Uždaryti ir atšaukti keitimus","CloseSaveChanges":"Uždaryti ir įrašyti keitimus","CloseTab":"Uždaryti skirtuką","ColumnPersonalization":"Stulpelio personalizavimas","Comments":"Komentarai","Confirmation":"Patvirtinimas","Contains":"Yra","CreateTab":"Kurti naują skirtuką","Cut":"Iškirpti","Delete":"Naikinti","DiscardUndo":"Atsisakyti / anuliuoti","DisplayDropDownList":"Rodyti išplečiamąjį sąrašą","Displaying":"Rodoma: ","DocWord":"Dokumentas","DoesNotContain":"Nėra","DoesNotEndWith":"Nesibaigia","DoesNotEqual":"Nėra lygu","DoesNotStartWith":"Neprasideda","Download":"Atsisiųsti","Duplicate":"Kopijuoti","Edit":"Redaguoti","EitherSelectedorNotSelected":"Pasirinkta arba nepasirinkta","Email":"El. paštas","EndsWith":"Baigiasi","EqualsStr":"Lygu","ExpandCollapse":"Išplėsti/sutraukti","ExportFailed":"Eksportuoti nepavyko","ExportToExcel":"Eksportuoti į „Excel“","FileInUse":"Nurodytas failas yra naudojamas","FileInUseDetail":"Uždarykite failą programoje, kurioje jis naudojamas, arba nurodykite kitą failo pavadinimą.","Filter":"Filtruoti","FilterMenu":"Filtro meniu","FilterOptions":"Filtro parinktys","FilterWithinResults":"Filtruoti rezultatus","First":"Pirmas","FirstView":"Pirmas rodinys","Folder":"Aplankas","ForgotPassword":"Pamiršote slaptažodį?","Forward":"Pirmyn","GetMoreRows":"Gauti daugiau eilučių","GreaterThan":"Daugiau nei","GreaterThanOrEquals":"Daugiau nei arba lygu","GridSettings":"Tinklelio parametrai","GroupSelection":"Grupės pasirinkimas","Help":"Žinynas","HideColumn":"Slėpti stulpelį","IsEmpty":"Tuščia","IsNotEmpty":"Netuščia","Last":"Paskutinis","LastView":"Paskutinis rodinys","LaunchActivate":"Paleisti/aktyvinti","LessThan":"Mažiau nei","LessThanOrEquals":"Mažiau nei arba lygu","Links":"Saitai","ListTabs":"Visų skirtukų sąrašas","LoadingItem":"Įkeliamas elementas ","Maintenance":"Priežiūra","Menu":"Meniu","New":"Naujas","Next":"Paskesnis","NextView":"Paskesnis rodinys","No":"Ne","NotChecked":"Nepažymėta","Notes":"Pastabos","NotSelected":"Nepasirinkta","Of":" iš ","Ok":"Gerai","Open":"Atidaryti","Password":"Slaptažodis","Paste":"Įklijuoti","Phone":"Telefonas","PleaseWait":"Palaukite","Previous":"Ankstesnis","PreviousView":"Ankstesnis rodinys","Print":"Spausdinti","Queries":"Užklausos","Redo":"Perdaryti","Refresh":"Atnaujinti","Reject":"Atmesti","RememberMe":"Prisiminti mane šiame kompiuteryje","Reports":"Ataskaitos","Reset":"Nustatyti iš naujo","Review":"Peržiūrėti","RunFilter":"Vykdyti filtrą","RunJob":"Vykdyti užduotį","Save":"Įrašyti","SaveBeforeClosing":"Įrašyti prieš uždarant","SavedFilters":"Įrašyti filtrus","SaveSubmit":"Įrašyti/pateikti","ScreenDesign":"Ekrano dizainas","Search":"Ieškoti","SelectContents":"Pasirinkti turinį","SelectDate":"Pasirinkti datą","SelectDeselect":"Pasirinkti / naikinti visą pasirinkimą","Selected":"Pasirinkta: ","ServerName":"Serverio pavadinimas","Settings":"Parametrai","ShowFilterRow":"Rodyti atfiltruotą eilutę","SignIn":"Prisijungti","SortAscending":"Rūšiuoti didėjimo tvarka","SortDescending":"Rūšiuoti mažėjimo tvarka","Spreadsheet":"Skaičiuoklė","StartsWith":"Prasideda","StatusIndicator":"Būsenos indikatorius","Tasks":"Užduotys","Today":"Šiandien","Translate":"Išversti","UserID":"Vartotojo ID","Utilities":"Naudmenos","Yes":"Taip","Page":"Puslapis","Rows":"Eilutės","ShowingAll":"Rodoma viskas","SessionNavigation":"Seanso naršymas","ListAllMenuItems":"Rodyti visus meniu elementus","NoRecordsFound":"Įrašų nerasta","SearchTree":"Ieškoti medyje","Clear":"Valyti","DrillDown":"Išskleisti","Required":"Šis laukas privalomas","Available":"Pasiekiama:","Add":"Pridėti","MoveDown":"Pereiti žemyn","MoveUp":"Pereiti aukštyn","Remove":"Šalinti","LastYear":"Praėję metai","NextMonth":"Paskesnis mėnuo","NextWeek":"Paskesnė savaitė","NextYear":"Paskesni metai","OneMonthAgo":"Prieš mėnesį","OneWeekAgo":"Prieš savaitę","SixMonthsAgo":"Prieš šešis mėnesius","Time":"Laikas","CannotBeSelected":"Šios eilutės negalima pasirinkti","ResetToDefault":"Iš naujo nustatyti numatytąjį išdėstymą","CloseOtherTabs":"Uždaryti kitus skirtukus","EmailValidation":"Įveskite galiojantį el. pašto adresą","UrlValidation":"Įveskite galiojantį URL","EndofResults":"Rezultatų pabaiga","More":"Daugiau...","RecordsPerPage":"Įrašų puslapyje","Maximize":"Maksimizuoti","Minimize":"Minimizuoti","CloseAllTabs":"Uždaryti visus skirtukus","QuickDates":"Sparčiosios datos","Finish":"Baigti","SetTextColor":"Nustatyti teksto spalvą","AttachmentRules":"Priedų taisyklės","AutoRefresh":"Automatiškai atnaujinti","BarChart":"Juostinė diagrama","CopyMail":"Kopijuoti ir siųsti","CopyUrl":"Kopijuoti URL","DistributeHorizontally":"Paskirstyti horizontaliai","ExpandAll":"Išplėsti viską","Generate":"Generuoti","GenerateScript":"Generuoti scenarijų","NoAttachments":"Priedų nėra","PieChart":"Skritulinė diagrama","QuickAccess":"Sparčioji prieiga","RestoreUser":"Atkurti vartotoją","SaveConsolidate":"Įrašyti naudojant vietos konsolidavimą","Screen Design":"Ekrano dizainas","SelectAll":"Pasirinkti viską","SpellCheck":"Rašybos tikrinimas","SubmitForApproval":"Pateikti tvirtinti","Timezone":"Laiko juosta","Loading":"Įkeliama...","NewNode":"Naujas mazgas","AboutText":"© 2014, autoriaus teisės priklauso „Infor“. Visos teisės ginamos. Čia pateikti tekstiniai ar vaizdiniai ženklai yra „Infor“ ir (arba) jos filialų ir priklausančių įmonių prekės ženklai ir (arba) registruotieji prekės ženklai. Visos teisės ginamos. Visi kiti čia pateikti prekės ženklai priklauso atitinkamiems jų savininkams. www.infor.com."}
});

}( this ));