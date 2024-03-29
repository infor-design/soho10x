/*
* Globalize Culture es-ES
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

Globalize.addCultureInfo( "es-ES", "default", {
	name: "es-ES",
	englishName: "Spanish (Spain, International Sort)",
	nativeName: "Español (España, alfabetización internacional)",
	language: "es",
	numberFormat: {
		",": ".",
		".": ",",
		NaN: "NeuN",
		negativeInfinity: "-Infinito",
		positiveInfinity: "Infinito",
		percent: {
			",": ".",
			".": ","
		},
		currency: {
			pattern: ["-n $","n $"],
			",": ".",
			".": ",",
			symbol: "€"
		}
	},
	calendars: {
		standard: {
			firstDay: 1,
			days: {
				names: ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],
				namesAbbr: ["dom","lun","mar","mié","jue","vie","sáb"],
				namesShort: ["do","lu","ma","mi","ju","vi","sá"]
			},
			months: {
				names: ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre",""],
				namesAbbr: ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic",""]
			},
			AM: null,
			PM: null,
			eras: [{"name":"d.C.","start":null,"offset":0}],
			patterns: {
				d: "dd/MM/yyyy",
				D: "dddd, dd' de 'MMMM' de 'yyyy",
				t: "H:mm",
				T: "H:mm:ss",
				f: "dddd, dd' de 'MMMM' de 'yyyy H:mm",
				F: "dddd, dd' de 'MMMM' de 'yyyy H:mm:ss",
				M: "dd MMMM",
				Y: "MMMM' de 'yyyy"
			}
		}
	},
	messages: {"AdditionalHelp":"Ayuda adicional","AddNewTab":"Añadir nueva ficha","Alerts":"Alertas","ApplyFilter":"Aplicar filtro","Approve":"Aprobar","Attachments":"Datos adjuntos","Back":"Atrás","Basic":"Básico","Between":"Entre","Book":"Libro","Cancel":"Cancelar","Checked":"Activado","ClearFilter":"Borrar filtro","Close":"Cerrar","CloseCancelChanges":"Cerrar y cancelar cambios","CloseSaveChanges":"Cerrar y guardar cambios","CloseTab":"Cerrar ficha","ColumnPersonalization":"Personalización de columnas","Comments":"Comentarios","Confirmation":"Confirmación","Contains":"Contiene","CreateTab":"Crear nueva ficha","Cut":"Cortar","Delete":"Eliminar","DiscardUndo":"Descartar/Deshacer","DisplayDropDownList":"Mostrar lista desplegable","Displaying":"Mostrado: ","DocWord":"Documento","DoesNotContain":"No contiene","DoesNotEndWith":"No acaba en","DoesNotEqual":"No es igual a","DoesNotStartWith":"No empieza por","Download":"Descargar","Duplicate":"Duplicar","Edit":"Editar","EitherSelectedorNotSelected":"Tanto seleccionado como no seleccionado","Email":"Correo electrónico","EndsWith":"Acaba en","EqualsStr":"Es igual a","ExpandCollapse":"Expandir/Contraer","ExportFailed":"No se pudo exportar","ExportToExcel":"Exportar a Excel","FileInUse":"El archivo especificado está en uso","FileInUseDetail":"Cierre el archivo en la aplicación donde está en uso o especifique un nombre de archivo diferente.","Filter":"Filtro","FilterMenu":"Menú de filtro","FilterOptions":"Opciones de filtro","FilterWithinResults":"Filtrar en resultados","First":"Primero","FirstView":"Primera vista","Folder":"Carpeta","ForgotPassword":"¿Olvidó la contraseña?","Forward":"Adelante","GetMoreRows":"Obtener más filas","GreaterThan":"Mayor que","GreaterThanOrEquals":"Mayor que o igual a","GridSettings":"Configuración de cuadrícula","GroupSelection":"Selección de grupo","Help":"Ayuda","HideColumn":"Ocultar columna","IsEmpty":"Esta vacío","IsNotEmpty":"No está vacío","Last":"Último","LastView":"Última vista","LaunchActivate":"Iniciar/Activar","LessThan":"Menos que","LessThanOrEquals":"Menor que o igual a","Links":"Vínculos","ListTabs":"Listar todas las fichas","LoadingItem":"Cargando elemento ","Maintenance":"Mantenimiento","Menu":"Menú","New":"Nuevo","Next":"Siguiente","NextView":"Siguiente vista","No":"No","NotChecked":"No activado","Notes":"Notas","NotSelected":"Sin seleccionar","Of":" de ","Ok":"Aceptar","Open":"Abrir","Password":"Contraseña","Paste":"Pegar","Phone":"Teléfono","PleaseWait":"Espere","Previous":"Anterior","PreviousView":"Vista anterior","Print":"Imprimir","Queries":"Consultas","Redo":"Rehacer","Refresh":"Actualizar","Reject":"Rechazar","RememberMe":"Recordar mis datos en este equipo","Reports":"Informes","Reset":"Restablecer","Review":"Revisar","RunFilter":"Ejecutar filtro","RunJob":"Ejecutar trabajo","Save":"Guardar","SaveBeforeClosing":"Guardar antes de cerrar","SavedFilters":"Filtros guardados","SaveSubmit":"Guardar/Enviar","ScreenDesign":"Diseño de pantalla","Search":"Buscar","SelectContents":"Seleccionar contenidos","SelectDate":"Seleccionar una fecha","SelectDeselect":"Seleccionar todo/Anular selección","Selected":"Seleccionado: ","ServerName":"Nombre de servidor","Settings":"Configuración","ShowFilterRow":"Mostrar fila de filtro","SignIn":"Iniciar sesión","SortAscending":"Orden ascendente","SortDescending":"Orden descendente","Spreadsheet":"Hoja de cálculo","StartsWith":"Empieza por","StatusIndicator":"Indicador de estado","Tasks":"Tareas","Today":"Hoy","Translate":"Traducir","UserID":"Id. de usuario","Utilities":"Utilidades","Yes":"Sí","Page":"Página","Rows":"Filas","ShowingAll":"Mostrando todo","SessionNavigation":"Navegación de sesión","ListAllMenuItems":"Listar todos los elementos de menú","NoRecordsFound":"No se encontraron registros","SearchTree":"Buscar en árbol","Clear":"Borrar","DrillDown":"Aumentar detalles","Required":"Este campo es obligatorio","Available":"Disponible:","Add":"Añadir","MoveDown":"Bajar","MoveUp":"Subir","Remove":"Quitar","LastYear":"Último año","NextMonth":"Siguiente mes","NextWeek":"Siguiente semana","NextYear":"Siguiente año","OneMonthAgo":"Hace un mes","OneWeekAgo":"Hace una semana","SixMonthsAgo":"Hace seis meses","Time":"Hora","CannotBeSelected":"Esta fila no se puede seleccionar.","ResetToDefault":"Restablecer diseño predeterminado","CloseOtherTabs":"Cerrar otras fichas","EmailValidation":"Introduzca una dirección de correo electrónico válida","UrlValidation":"Introduzca una dirección URL válida","EndofResults":"Fin de resultados","More":"Más...","RecordsPerPage":"Registros por página","Maximize":"Maximizar","Minimize":"Minimizar","CloseAllTabs":"Cerrar todas las fichas","QuickDates":"Fechas rápidas","Finish":"Finalizar","SetTextColor":"Establecer color de texto","AttachmentRules":"Reglas de adjuntos","AutoRefresh":"Actualización automática","BarChart":"Gráfico de barras","CopyMail":"Copiar y enviar por correo","CopyUrl":"Copiar URL","DistributeHorizontally":"Distribuir horizontalmente","ExpandAll":"Expandir todo","Generate":"Generar","GenerateScript":"Generar sec. comandos","NoAttachments":"Sin adjuntos","PieChart":"Gráfico circular","QuickAccess":"Acceso rápido","RestoreUser":"Restaurar usuario","SaveConsolidate":"Guardar con consolidación local","Screen Design":"Diseño de pantalla","SelectAll":"Seleccionar todo","SpellCheck":"Corregir ortografía","SubmitForApproval":"Enviar para aprobación","Timezone":"Zona horaria","Loading":"Cargando...","NewNode":"Nuevo nodo","AboutText":"Copyright © 2015 Infor. Todos los derechos están reservados. Las marcas denominativas y figurativas mencionadas a continuación son marcas comerciales y marcas comerciales registradas de Infor y/o sus empresas filiales y subsidiarias", "SelectMonthYear":"Seleccione Mes y Año"}
});

}( this ));
