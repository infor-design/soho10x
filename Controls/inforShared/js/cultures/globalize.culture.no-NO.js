/*
* Globalize Culture nb-NO
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

Globalize.addCultureInfo( "no-NO", "default", {
	name: "no-NO",
	englishName: "Norwegian, (Norway)",
	nativeName: "norsk, (Norge)",
	language: "no",
	numberFormat: {
		",": " ",
		".": ",",
		negativeInfinity: "-INF",
		positiveInfinity: "INF",
		percent: {
			",": " ",
			".": ","
		},
		currency: {
			pattern: ["$ -n","$ n"],
			",": " ",
			".": ",",
			symbol: "kr"
		}
	},
	calendars: {
		standard: {
			"/": ".",
			firstDay: 1,
			days: {
				names: ["søndag","mandag","tirsdag","onsdag","torsdag","fredag","lørdag"],
				namesAbbr: ["sø","ma","ti","on","to","fr","lø"],
				namesShort: ["sø","ma","ti","on","to","fr","lø"]
			},
			months: {
				names: ["januar","februar","mars","april","mai","juni","juli","august","september","oktober","november","desember",""],
				namesAbbr: ["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","des",""]
			},
			AM: null,
			PM: null,
			patterns: {
				d: "dd.MM.yyyy",
				D: "d. MMMM yyyy",
				t: "HH:mm",
				T: "HH:mm:ss",
				f: "d. MMMM yyyy HH:mm",
				F: "d. MMMM yyyy HH:mm:ss",
				M: "d. MMMM",
				Y: "MMMM yyyy"
			}
		}
	},
	messages: {"AdditionalHelp":"Ekstra hjelp","AddNewTab":"Legg til ny kategori","Alerts":"Varsler","ApplyFilter":"Bruk filter","Approve":"Godkjenn","Attachments":"Vedlegg","Back":"Tilbake","Basic":"Basis","Between":"Mellom","Book":"Bok","Cancel":"Avbryt","Checked":"Kontrollert","ClearFilter":"Fjern filter","Close":"Lukk","CloseCancelChanges":"Lukk og avbryt endringer","CloseSaveChanges":"Lukk og lagre endringer","CloseTab":"Lukk kategori","ColumnPersonalization":"Egendefinering av kolonne","Comments":"Kommentarer","Confirmation":"Bekreftelse","Contains":"Inneholder","CreateTab":"Opprett en ny kategori","Cut":"Klipp ut","Delete":"Slett","DiscardUndo":"Forkast/angre","DisplayDropDownList":"Vis nedtrekksliste","Displaying":"Viser: ","DocWord":"Dokument","DoesNotContain":"Inneholder ikke","DoesNotEndWith":"Slutter ikke med","DoesNotEqual":"Er ikke lik","DoesNotStartWith":"Starter ikke med","Download":"Last ned","Duplicate":"Dupliser","Edit":"Rediger","EitherSelectedorNotSelected":"Rediger valgte eller ikke valgte","Email":"E-post","EndsWith":"Slutter med","EqualsStr":"Er lik","ExpandCollapse":"Utvid/skjul","ExportFailed":"Eksport mislyktes","ExportToExcel":"Eksporter til Excel","FileInUse":"Spesifisert fil er i bruk","FileInUseDetail":"Lukk filen i programmet det er i bruk eller angi et annet filnavn.","Filter":"Filter","FilterMenu":"Filtermeny","FilterOptions":"Filteralternativer","FilterWithinResults":"Filtrer i resultater","First":"Først","FirstView":"Vis først","Folder":"Mappe","ForgotPassword":"Glemt passord?","Forward":"Videresend","GetMoreRows":"Få flere rader","GreaterThan":"Mer enn","GreaterThanOrEquals":"Mer enn eller lik","GridSettings":"Rutenettinnstillinger","GroupSelection":"Gruppevalg","Help":"Hjelp","HideColumn":"Skjul kolonne","IsEmpty":"Er tom","IsNotEmpty":"Er ikke tom","Last":"Siste","LastView":"Siste visning","LaunchActivate":"Åpne/aktiver","LessThan":"Mindre enn","LessThanOrEquals":"Mindre enn eller lik","Links":"Koblinger","ListTabs":"List opp alle kategorier","LoadingItem":"Laster opp element ","Maintenance":"Vedlikehold","Menu":"Meny","New":"Ny","Next":"Neste","NextView":"Neste visning","No":"Nei","NotChecked":"Ikke kontrollert","Notes":"Merknader","NotSelected":"Ikke valgt","Of":" av ","Ok":"OK","Open":"Åpne","Password":"Passord","Paste":"Lim inn","Phone":"Telefon","PleaseWait":"Vennligst vent","Previous":"Forrige","PreviousView":"Forrige visning","Print":"Skriv ut","Queries":"Forespørsler","Redo":"Gjør om","Refresh":"Oppdater","Reject":"Avvis","RememberMe":"Husk meg på denne datamaskinen","Reports":"Rapporter","Reset":"Tilbakestill","Review":"Se gjennom","RunFilter":"Kjør filter","RunJob":"Kjør jobb","Save":"Lagre","SaveBeforeClosing":"Lagre og lukk","SavedFilters":"Lagrede filtre","SaveSubmit":"Lagre/send","ScreenDesign":"Skjermdesign","Search":"Søk","SelectContents":"Velg innhold","SelectDate":"Velg en dato","SelectDeselect":"Velg/fjern merking av alle","Selected":"Valgt: ","ServerName":"Servernavn","Settings":"Innstillinger","ShowFilterRow":"Vis filterrad","SignIn":"Logge på","SortAscending":"Sorter stigende","SortDescending":"Sorter synkende","Spreadsheet":"Regneark","StartsWith":"Starter med","StatusIndicator":"Statusindikator","Tasks":"Oppgaver","Today":"I dag","Translate":"Oversett","UserID":"Bruker-ID","Utilities":"Verktøy","Yes":"Ja","Page":"Side","Rows":"Rader","ShowingAll":"Viser alle","SessionNavigation":"Navigere i økt","ListAllMenuItems":"List opp alle menyelementer","NoRecordsFound":"Ingen poster funnet","SearchTree":"Søk tre","Clear":"Fjern","DrillDown":"Drille ned","Required":"Dette feltet er obligatorisk","Available":"Tilgjengelig:","Add":"Legg til","MoveDown":"Flytt ned","MoveUp":"Flytt opp","Remove":"Fjern","LastYear":"I fjor","NextMonth":"Neste måned","NextWeek":"Neste uke","NextYear":"Neste år","OneMonthAgo":"Én måned siden","OneWeekAgo":"Én uke siden","SixMonthsAgo":"Seks måneder siden","Time":"Tid","CannotBeSelected":"Denne raden kan ikke slettes.","ResetToDefault":"Tilbakestill til standardoppsett","CloseOtherTabs":"Lukk andre kategorier","EmailValidation":"Skriv inn en gyldig e-postadresse","UrlValidation":"Skriv inn en gyldig URL","EndofResults":"Slutten av resultatene","More":"Mer...","RecordsPerPage":"Oppføringer per side","Maximize":"Maksimer","Minimize":"Minimer"}
});

}( this ));
