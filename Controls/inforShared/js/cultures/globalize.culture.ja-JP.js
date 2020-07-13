/*
* Globalize Culture ja-JP
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

Globalize.addCultureInfo( "ja-JP", "default", {
	name: "ja-JP",
	englishName: "Japanese (Japan)",
	nativeName: "日本語 (日本)",
	language: "ja",
	numberFormat: {
		NaN: "NaN (非数値)",
		negativeInfinity: "-∞",
		positiveInfinity: "+∞",
		percent: {
			pattern: ["-n%","n%"]
		},
		currency: {
			pattern: ["-$n","$n"],
			decimals: 0,
			symbol: "¥"
		}
	},
	calendars: {
		standard: {
			days: {
				names: ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"],
				namesAbbr: ["日","月","火","水","木","金","土"],
				namesShort: ["日","月","火","水","木","金","土"]
			},
			months: {
				names: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月",""],
				namesAbbr: ["1","2","3","4","5","6","7","8","9","10","11","12",""]
			},
			AM: ["午前","午前","午前"],
			PM: ["午後","午後","午後"],
			eras: [{"name":"西暦","start":null,"offset":0}],
			patterns: {
				d: "yyyy/MM/dd",
				D: "yyyy'年'M'月'd'日'",
				t: "H:mm",
				T: "H:mm:ss",
				f: "yyyy'年'M'月'd'日' H:mm",
				F: "yyyy'年'M'月'd'日' H:mm:ss",
				M: "M'月'd'日'",
				Y: "yyyy'年'M'月'"
			}
		},
		Japanese: {
			name: "Japanese",
			days: {
				names: ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"],
				namesAbbr: ["日","月","火","水","木","金","土"],
				namesShort: ["日","月","火","水","木","金","土"]
			},
			months: {
				names: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月",""],
				namesAbbr: ["1","2","3","4","5","6","7","8","9","10","11","12",""]
			},
			AM: ["午前","午前","午前"],
			PM: ["午後","午後","午後"],
			eras: [{"name":"平成","start":null,"offset":1867},{"name":"昭和","start":-1812153600000,"offset":1911},{"name":"大正","start":-1357603200000,"offset":1925},{"name":"明治","start":60022080000,"offset":1988}],
			twoDigitYearMax: 99,
			patterns: {
				d: "gg y/M/d",
				D: "gg y'年'M'月'd'日'",
				t: "H:mm",
				T: "H:mm:ss",
				f: "gg y'年'M'月'd'日' H:mm",
				F: "gg y'年'M'月'd'日' H:mm:ss",
				M: "M'月'd'日'",
				Y: "gg y'年'M'月'"
			}
		}
	},
	messages: {"AdditionalHelp":"追加のヘルプ","AddNewTab":"タブの新規追加","Alerts":"アラート","ApplyFilter":"フィルターの適用","Approve":"承認","Attachments":"添付","Back":"戻る","Basic":"基本","Between":"次の値の間","Book":"ブック","Cancel":"キャンセル","Checked":"チェック済","ClearFilter":"フィルターのクリア","Close":"閉じる","CloseCancelChanges":"閉じて変更をキャンセル","CloseSaveChanges":"閉じて変更を保存","CloseTab":"タブを閉じる","ColumnPersonalization":"列の個人用設定","Comments":"コメント","Confirmation":"確認","Contains":"含む","CreateTab":"タブの新規作成","Cut":"切り取り","Delete":"削除","DiscardUndo":"破棄/元に戻す","DisplayDropDownList":"ドロップダウンリストを表示","Displaying":"表示中: ","DocWord":"ドキュメント","DoesNotContain":"含まない","DoesNotEndWith":"次の値で終わらない","DoesNotEqual":"等しくない","DoesNotStartWith":"次の値で始まらない","Download":"ダウンロード","Duplicate":"複製","Edit":"編集","EitherSelectedorNotSelected":"選択済か未選択","Email":"電子メール","EndsWith":"次の値で終わる","EqualsStr":"等しい","ExpandCollapse":"展開/折りたたみ","ExportFailed":"エクスポートできませんでした","ExportToExcel":"Excel にエクスポート","FileInUse":"指定のファイルは既に使用されています","FileInUseDetail":"既に使用されているアプリケーションのファイルを閉じるか、別のファイル名を指定します。","Filter":"フィルター","FilterMenu":"フィルターメニュー","FilterOptions":"フィルターオプション","FilterWithinResults":"結果のフィルター","First":"最初","FirstView":"最初のビュー","Folder":"フォルダー","ForgotPassword":"パスワードを忘れた場合","Forward":"進む","GetMoreRows":"追加の行を取得","GreaterThan":"より大きい","GreaterThanOrEquals":"より大きいか等しい","GridSettings":"グリッドの設定","GroupSelection":"グループの選択","Help":"ヘルプ","HideColumn":"列を非表示","IsEmpty":"空","IsNotEmpty":"空でない","Last":"最後","LastView":"最後のビュー","LaunchActivate":"開始/有効化","LessThan":"より小さい","LessThanOrEquals":"より小さいか等しい","Links":"リンク","ListTabs":"すべてのタブの一覧表示","LoadingItem":"項目をロードしています ","Maintenance":"管理","Menu":"メニュー","New":"新規作成","Next":"次へ","NextView":"次のビュー","No":"いいえ","NotChecked":"未チェック","Notes":"注記","NotSelected":"未選択","Of":" / ","Ok":"OK","Open":"オープン","Password":"パスワード","Paste":"貼り付け","Phone":"電話","PleaseWait":"お待ちください","Previous":"前へ","PreviousView":"前のビュー","Print":"印刷","Queries":"クエリ","Redo":"やり直し","Refresh":"リフレッシュ","Reject":"拒否","RememberMe":"このコンピュータに保存する","Reports":"レポート","Reset":"リセット","Review":"レビュー","RunFilter":"フィルターの実行","RunJob":"ジョブの実行","Save":"保存","SaveBeforeClosing":"閉じる前に保存","SavedFilters":"保存したフィルター","SaveSubmit":"保存/送信","ScreenDesign":"画面デザイン","Search":"検索","SelectContents":"コンテンツの選択","SelectDate":"日付を選択","SelectDeselect":"すべて選択/選択解除","Selected":"選択済: ","ServerName":"サーバー名","Settings":"設定","ShowFilterRow":"フィルター行の表示","SignIn":"サインイン","SortAscending":"昇順に並べ替え","SortDescending":"降順に並べ替え","Spreadsheet":"スプレッドシート","StartsWith":"次の値で始まる","StatusIndicator":"状況インジケーター","Tasks":"タスク","Today":"今日","Translate":"翻訳","UserID":"ユーザー ID","Utilities":"ユーティリティ","Yes":"はい","Page":"ページ","Rows":"行","ShowingAll":"すべて表示","SessionNavigation":"セッションナビゲーション","ListAllMenuItems":"全メニュー項目のリスト","NoRecordsFound":"レコードがありません","SearchTree":"ツリーを検索","Clear":"クリア","DrillDown":"ドリルダウン","Required":"このフィールドは必須です","Available":"使用可能:","Add":"追加","MoveDown":"下に移動","MoveUp":"上に移動","Remove":"削除","LastYear":"前年","NextMonth":"来月","NextWeek":"来週","NextYear":"来年","OneMonthAgo":"1 か月前","OneWeekAgo":"1 週間前","SixMonthsAgo":"6 か月前","Time":"時間","CannotBeSelected":"この行は選択できません。","ResetToDefault":"デフォルトのレイアウトに戻す","CloseOtherTabs":"他のタブを閉じる","EmailValidation":"有効な電子メールアドレスを入力してください","UrlValidation":"有効な URL を入力してください","EndofResults":"結果の終わり","More":"その他...","RecordsPerPage":"1 ページのレコード数","Maximize":"最大化","Minimize":"最小化","CloseAllTabs":"全てのタブを閉じる","QuickDates":"クイック日付入力","Finish":"完了","SetTextColor":"文字の色の設定","AttachmentRules":"添付ルール","AutoRefresh":"自動更新","BarChart":"横棒グラフ","CopyMail":"コピーしてメール","CopyUrl":"URL のコピー","DistributeHorizontally":"左右に整列","ExpandAll":"すべて展開","Generate":"生成","GenerateScript":"スクリプトの生成","NoAttachments":"添付なし","PieChart":"円グラフ","QuickAccess":"クイックアクセス","RestoreUser":"ユーザーの復元","SaveConsolidate":"ローカル連結で保存","Screen Design":"画面デザイン","SelectAll":"すべて選択","SpellCheck":"スペルチェック","SubmitForApproval":"承認のため送信","Timezone":"タイムゾーン","Loading":"ロードしています...","NewNode":"新規ノード","AboutText":"Copyright © 2014 Infor. All rights reserved. ここに示す文字標章及び図形標章は、Infor及び/またはその関連会社ならびに子会社の商標または登録商標、あるいはその両方です。無断複製・転載を禁ず。本書に記載されるその他すべての商標名は各所有者の所有物です。www.infor.com"}
});

}( this ));
