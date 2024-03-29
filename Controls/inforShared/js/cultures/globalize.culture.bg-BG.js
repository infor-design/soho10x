﻿/*
* Globalize Culture bg-BG
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

Globalize.addCultureInfo( "bg-BG", "default", {
	name: "bg-BG",
	englishName: "Bulgarian (Bulgaria)",
	nativeName: "български (България)",
	language: "bg",
	numberFormat: {
		",": " ",
		".": ",",
		negativeInfinity: "- безкрайност",
		positiveInfinity: "+ безкрайност",
		percent: {
			",": " ",
			".": ","
		},
		currency: {
			pattern: ["-n $","n $"],
			",": " ",
			".": ",",
			symbol: "лв."
		}
	},
	calendars: {
		standard: {
			"/": ".",
			firstDay: 1,
			days: {
				names: ["неделя","понеделник","вторник","сряда","четвъртък","петък","събота"],
				namesAbbr: ["нед","пон","вт","ср","четв","пет","съб"],
				namesShort: ["н","п","в","с","ч","п","с"]
			},
			months: {
				names: ["януари","февруари","март","април","май","юни","юли","август","септември","октомври","ноември","декември",""],
				namesAbbr: ["ян","февр","март","апр","май","юни","юли","авг","септ","окт","ноември","дек",""]
			},
			AM: null,
			PM: null,
			eras: [{"name":"след новата ера","start":null,"offset":0}],
			patterns: {
				d: "d.M.yyyy 'г.'",
				D: "dd MMMM yyyy 'г.'",
				t: "HH:mm 'ч.'",
				T: "HH:mm:ss 'ч.'",
				f: "dd MMMM yyyy 'г.' HH:mm 'ч.'",
				F: "dd MMMM yyyy 'г.' HH:mm:ss 'ч.'",
				M: "dd MMMM",
				Y: "MMMM yyyy 'г.'"
			}
		}
	},
	messages: {"AdditionalHelp":"Допълнителна помощ","AddNewTab":"Добави нов раздел","Alerts":"Известявания","ApplyFilter":"Приложи филтър","Approve":"Одобри","Attachments":"Прикачени файлове","Back":"Назад","Basic":"Основни","Between":"Между","Book":"Книга","Cancel":"Отмени","Checked":"Проверен","ClearFilter":"Изчисти филтър","Close":"Затвори","CloseCancelChanges":"Затвори и отмени промените","CloseSaveChanges":"Затвори и запиши промените","CloseTab":"Затвори раздел","ColumnPersonalization":"Персонализиране на колони","Comments":"Коментари","Confirmation":"Потвърждение","Contains":"Съдържа","CreateTab":"Създай нов раздел","Cut":"Изрежи","Delete":"Изтрий","DiscardUndo":"Анулирай/отмени","DisplayDropDownList":"Покажи падащ списък","Displaying":"Изобразяване: ","DocWord":"Документ","DoesNotContain":"Не съдържа","DoesNotEndWith":"Не завършва с","DoesNotEqual":"Не се равнява на","DoesNotStartWith":"Не започва с","Download":"Изтегли","Duplicate":"Дублирай","Edit":"Редактирай","EitherSelectedorNotSelected":"Избраните или тези, които не са избрани","Email":"Имейл","EndsWith":"Свършва с","EqualsStr":"Равнява се на","ExpandCollapse":"Разшири/свий","ExportFailed":"Неуспешно експортиране","ExportToExcel":"Експортирай в Excel","FileInUse":"Указаният файл се използва","FileInUseDetail":"Затвори файла в приложението, в което се използва или укажи друго име на файла.","Filter":"Филтър","FilterMenu":"Меню на филтър","FilterOptions":"Опции за филтър","FilterWithinResults":"Филтър в резултати","First":"Първи","FirstView":"Първи изглед","Folder":"Папка","ForgotPassword":"Забравихте паролата си?","Forward":"Напред","GetMoreRows":"Добави още редове","GreaterThan":"По-голямо от","GreaterThanOrEquals":"По-голямо от или равно на","GridSettings":"Настройки на решетка","GroupSelection":"Групов избор","Help":"Помощ","HideColumn":"Скрий колони","IsEmpty":"Е празно","IsNotEmpty":"Не е празно","Last":"Последен","LastView":"Последен изглед","LaunchActivate":"Стартирай/активирай","LessThan":"По-малко от","LessThanOrEquals":"По-голямо от или равно на","Links":"Връзки","ListTabs":"Изведи в списък всички раздели","LoadingItem":"Зареждане на елемент ","Maintenance":"Поддръжка","Menu":"Меню","New":"Нов","Next":"Следващ","NextView":"Следващ изглед","No":"Не","NotChecked":"Не е отметнат","Notes":"Забележки","NotSelected":"Не е избран","Of":" на ","Ok":"ОК.","Open":"Отвори","Password":"Парола","Paste":"Постави","Phone":"Телефон","PleaseWait":"Моля, изчакайте","Previous":"Предишен","PreviousView":"Предишен изглед","Print":"Печат","Queries":"Запитвания","Redo":"Върни","Refresh":"Опресни","Reject":"Отхвърли","RememberMe":"Запомни ме на този компютър","Reports":"Отчети","Reset":"Възстанови","Review":"Прегледай","RunFilter":"Изпълни филтър","RunJob":"Изпълни задача","Save":"Запис","SaveBeforeClosing":"Запиши преди да затвориш","SavedFilters":"Записани филтри","SaveSubmit":"Запиши/изпрати","ScreenDesign":"Организация на екрана","Search":"Търсене","SelectContents":"Избери съдържание","SelectDate":"Избери дата","SelectDeselect":"Избери/премахни избора от","Selected":"Избрани: ","ServerName":"Име на сървър","Settings":"Настройки","ShowFilterRow":"Покажи ред от филтър","SignIn":"Вписване","SortAscending":"Сортирай възходящо","SortDescending":"Сортирай низходящо","Spreadsheet":"Таблица","StartsWith":"Започва с","StatusIndicator":"Индикатор на състоянието","Tasks":"Задачи","Today":"Днес","Translate":"Преведи","UserID":"ИД на потребител","Utilities":"Помощни програми","Yes":"Да","Page":"Страница","Rows":"Редове","ShowingAll":"Показване на всички","SessionNavigation":"Навигация на сесия","ListAllMenuItems":"Изведи в списък всички елементи на менюто","NoRecordsFound":"Няма открити записи","SearchTree":"Дървовидна структура на търсенето","Clear":"Изчисти","DrillDown":"Изведи подробно","Required":"Това поле е задължително","Available":"Налично:","Add":"Добави:","MoveDown":"Премести надолу","MoveUp":"Премести нагоре","Remove":"Премахни","LastYear":"Миналата година","NextMonth":"Следващия месец","NextWeek":"Следващата седмица","NextYear":"Следващата година","OneMonthAgo":"Преди един месец","OneWeekAgo":"Преди една седмица","SixMonthsAgo":"Преди шест месеца","Time":"Час","CannotBeSelected":"Този ред не може да бъде избран.","ResetToDefault":"Възстанови оформлението по подразбиране","CloseOtherTabs":"Затвори останалите раздели","EmailValidation":"Въведи валиден имейл адрес","UrlValidation":"Въведи валиден URL адрес","EndofResults":"Последни резултати","More":"Още...","RecordsPerPage":"Записа на страница","Maximize":"Увеличете","Minimize":"Минимизиране"}
});

}( this ));
