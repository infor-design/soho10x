/*
* Globalize Culture fr-FR
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

Globalize.addCultureInfo( "fr-FR", "default", {
	name: "fr-FR",
	englishName: "French (France)",
	nativeName: "français (France)",
	language: "fr",
	numberFormat: {
		",": " ",
		".": ",",
		NaN: "Non Numérique",
		negativeInfinity: "-Infini",
		positiveInfinity: "+Infini",
		percent: {
			",": " ",
			".": ","
		},
		currency: {
			pattern: ["-n $","n $"],
			",": " ",
			".": ",",
			symbol: "€"
		}
	},
	calendars: {
		standard: {
			firstDay: 1,
			days: {
				names: ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],
				namesAbbr: ["dim.","lun.","mar.","mer.","jeu.","ven.","sam."],
				namesShort: ["di","lu","ma","me","je","ve","sa"]
			},
			months: {
				names: ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre",""],
				namesAbbr: ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc.",""]
			},
			AM: null,
			PM: null,
			eras: [{"name":"ap. J.-C.","start":null,"offset":0}],
			patterns: {
				d: "dd/MM/yyyy",
				D: "dddd d MMMM yyyy",
				t: "HH:mm",
				T: "HH:mm:ss",
				f: "dddd d MMMM yyyy HH:mm",
				F: "dddd d MMMM yyyy HH:mm:ss",
				M: "d MMMM",
				Y: "MMMM yyyy"
			}
		}
	},
	messages: {"AdditionalHelp":"Aide supplémentaire","AddNewTab":"Ajouter un onglet","Alerts":"Alertes","ApplyFilter":"Appliquer filtre","Approve":"Approuver","Attachments":"Pièces jointes","Back":"Précédent","Basic":"De base","Between":"Entre","Book":"Livre","Cancel":"Annuler","Checked":"Coché(e)","ClearFilter":"Effacer le filtre","Close":"Fermer","CloseCancelChanges":"Fermer et annuler les modifications","CloseSaveChanges":"Fermer et enregistrer les modifications","CloseTab":"Fermer l\u0027onglet","ColumnPersonalization":"Personnalisation de colonne","Comments":"Commentaires","Confirmation":"Confirmation","Contains":"Contient","CreateTab":"Créer un nouvel onglet","Cut":"Couper","Delete":"Supprimer","DiscardUndo":"Supprimer/annuler","DisplayDropDownList":"Afficher la liste déroulante","Displaying":"Affichage : ","DocWord":"Document","DoesNotContain":"Ne contient pas","DoesNotEndWith":"Ne finit pas par","DoesNotEqual":"N\u0027est pas égal(e)","DoesNotStartWith":"Ne commence pas par","Download":"Télécharger","Duplicate":"Copier","Edit":"Modifier","EitherSelectedorNotSelected":"Sélectionné ou Non sélectionné","Email":"E-mail","EndsWith":"Finit par","EqualsStr":"Est égal(e)","ExpandCollapse":"Développer/réduire","ExportFailed":"Echec de l\u0027exportation","ExportToExcel":"Exporter vers Excel","FileInUse":"Fichier spécifié est en cours d\u0027utilisation","FileInUseDetail":"Fermez le fichier dans l\u0027application qui l\u0027utilise ou spécifiez un nom de fichier différent.","Filter":"Filtrer","FilterMenu":"Menu Filtre","FilterOptions":"Options filtre","FilterWithinResults":"Filtrer les résultats","First":"Premier","FirstView":"Première vue","Folder":"Dossier","ForgotPassword":"Mot de passe oublié ?","Forward":"Faire suivre","GetMoreRows":"Lignes supplémentaires","GreaterThan":"Supérieur à","GreaterThanOrEquals":"Supérieur ou égal à","GridSettings":"Paramètres de grille","GroupSelection":"Sélection de groupe","Help":"Aide","HideColumn":"Masquer la colonne","IsEmpty":"Est vide","IsNotEmpty":"N\u0027est pas vide","Last":"Dernier","LastView":"Dernière vue","LaunchActivate":"Lancer/activer","LessThan":"Inférieur à","LessThanOrEquals":"Inférieur ou égal à","Links":"Liens","ListTabs":"Lister tous les onglets","LoadingItem":"Chargement d\u0027article ","Maintenance":"Maintenance","Menu":"Menu","New":"Nouveau","Next":"Suivant","NextView":"Vue suivante","No":"Non","NotChecked":"Pas coché(e)","Notes":"Remarques","NotSelected":"Pas sélectionné(e)","Of":" sur ","Ok":"OK","Open":"Ouvrir","Password":"Mot de passe","Paste":"Coller","Phone":"Téléphone","PleaseWait":"Patientez","Previous":"Précédent","PreviousView":"Vue précédente","Print":"Imprimer","Queries":"Demandes","Redo":"Rétablir","Refresh":"Actualiser","Reject":"Rejeter","RememberMe":"Se souvenir de moi à cet ordinateur","Reports":"Etats","Reset":"Réinitialiser","Review":"Réviser","RunFilter":"Exécuter le filtre","RunJob":"Exécuter la tâche","Save":"Enregistrer","SaveBeforeClosing":"Enregistrer avant de fermer","SavedFilters":"Filtres enregistrés","SaveSubmit":"Enregistrer/soumettre","ScreenDesign":"Conception d\u0027écran","Search":"Rechercher","SelectContents":"Sélectionner les contenus","SelectDate":"Sélectionner une date","SelectDeselect":"Sélectionner / désélectionner tout","Selected":"Sélection : ","ServerName":"Nom du serveur","Settings":"Paramètres","ShowFilterRow":"Afficher la ligne de filtre","SignIn":"Connexion","SortAscending":"Tri ascendant","SortDescending":"Tri descendant","Spreadsheet":"Tableur","StartsWith":"Commence par","StatusIndicator":"Indicateur d\u0027état","Tasks":"Tâches","Today":"Aujourd\u0027hui","Translate":"Traduire","UserID":"ID utilisateur","Utilities":"Outils","Yes":"Oui","Page":"Page","Rows":"Lignes","ShowingAll":"Afficher tout","SessionNavigation":"Navigation de session","ListAllMenuItems":"Lister tous les éléments de menu","NoRecordsFound":"Enregistrements introuvables","SearchTree":"Rechercher arborescence","Clear":"Effacer","DrillDown":"Zoom avant","Required":"Champ requis","Available":"Disponible :","Add":"Ajouter","MoveDown":"Déplacer vers le bas","MoveUp":"Déplacer vers le haut","Remove":"Supprimer","LastYear":"Année précédente","NextMonth":"Mois suivant","NextWeek":"Semaine suivante","NextYear":"Année suivante","OneMonthAgo":"Il y a 1 mois","OneWeekAgo":"Il y a une semaine","SixMonthsAgo":"Il y a 6 mois","Time":"Heure","CannotBeSelected":"Impossible de sélectionner cette ligne.","ResetToDefault":"Rétablir à disposition par défaut","CloseOtherTabs":"Fermer les autres onglets","EmailValidation":"Saisissez une adresse e-mail valide","UrlValidation":"Saisissez une URL valide","EndofResults":"Fin des résultats","More":"Plus...","RecordsPerPage":"Enregistrements par page","Maximize":"Agrandir","Minimize":"Réduire","CloseAllTabs":"Fermer tous les onglets","QuickDates":"Dates rapides","Finish":"Terminer","SetTextColor":"Définir la couleur du texte","AttachmentRules":"Règles de pièces jointes","AutoRefresh":"Actualiser automatiquement","BarChart":"Graphique à barres","CopyMail":"Copier et envoyer","CopyUrl":"Copier Url","DistributeHorizontally":"Répartir horizontalement","ExpandAll":"Développer tout","Generate":"Générer","GenerateScript":"Générer un script","NoAttachments":"Aucune pièce jointe","PieChart":"Graphique en secteurs","QuickAccess":"Accès rapide","RestoreUser":"Restaurer l\u0027utilisateur","SaveConsolidate":"Enregistrer avec consolidation locale","Screen Design":"Conception d\u0027écran","SelectAll":"Sélectionner tout","SpellCheck":"Vérifier l\u0027orthographe","SubmitForApproval":"Soumettre pour approbation","Timezone":"Fuseau horaire","Loading":"Chargement...","NewNode":"Nouveau noeud","AboutText":"Copyright © 2014 Infor. Tous droits réservés. Les termes et marques de conception mentionnés ci-après sont des marques et/ou des marques déposées d\u0027Infor et/ou de ses partenaires et filiales. Tous droits réservés. Toutes les autres marques répertoriées ci-après sont la propriété de leurs propriétaires respectifs. www.infor.com.", "SelectMonthYear":"Sélectionnez un mois et une année"}
});

}( this ));
