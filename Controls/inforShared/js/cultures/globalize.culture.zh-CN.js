﻿/*
* Globalize Culture zh-CN
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

Globalize.addCultureInfo( "zh-CN", "default", {
	name: "zh-CN",
	englishName: "Chinese (Simplified, PRC)",
	nativeName: "中文(中华人民共和国)",
	language: "zh-CHS",
	numberFormat: {
		NaN: "非数字",
		negativeInfinity: "负无穷大",
		positiveInfinity: "正无穷大",
		percent: {
			pattern: ["-n%","n%"]
		},
		currency: {
			pattern: ["$-n","$n"],
			symbol: "¥"
		}
	},
	calendars: {
		standard: {
			days: {
				names: ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
				namesAbbr: ["周日","周一","周二","周三","周四","周五","周六"],
				namesShort: ["日","一","二","三","四","五","六"]
			},
			months: {
				names: ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月",""],
				namesAbbr: ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月",""]
			},
			AM: ["上午","上午","上午"],
			PM: ["下午","下午","下午"],
			eras: [{"name":"公元","start":null,"offset":0}],
			patterns: {
				d: "yyyy/M/d",
				D: "yyyy'年'M'月'd'日'",
				t: "H:mm",
				T: "H:mm:ss",
				f: "yyyy'年'M'月'd'日' H:mm",
				F: "yyyy'年'M'月'd'日' H:mm:ss",
				M: "M'月'd'日'",
				Y: "yyyy'年'M'月'"
			}
		}
	},
	messages: {"AdditionalHelp":"附加帮助","AddNewTab":"新添选项卡","Alerts":"警报","ApplyFilter":"应用筛选器","Approve":"批准","Attachments":"附件","Back":"后退","Basic":"基本","Between":"介于","Book":"账簿","Cancel":"取消","Checked":"已选中","ClearFilter":"清除筛选器","Close":"关闭","CloseCancelChanges":"关闭并取消更改","CloseSaveChanges":"关闭并保存更改","CloseTab":"关闭选项卡","ColumnPersonalization":"列个性化设置","Comments":"备注","Confirmation":"确认","Contains":"包含","CreateTab":"创建新选项卡","Cut":"剪切","Delete":"删除","DiscardUndo":"放弃/撤消","DisplayDropDownList":"显示下拉列表","Displaying":"显示内容: ","DocWord":"文档","DoesNotContain":"不包含","DoesNotEndWith":"结束值非","DoesNotEqual":"不等于","DoesNotStartWith":"起始值非","Download":"下载","Duplicate":"复制","Edit":"编辑","EitherSelectedorNotSelected":"选定项或非选定项","Email":"电子邮件","EndsWith":"结束值为","EqualsStr":"等于","ExpandCollapse":"展开/折叠","ExportFailed":"导出失败","ExportToExcel":"导出至 Excel","FileInUse":"指定的文件在使用中","FileInUseDetail":"请在相关的应用程序中关闭此文件，或者指定其他文件名。","Filter":"筛选器","FilterMenu":"筛选菜单","FilterOptions":"筛选选项","FilterWithinResults":"在结果中筛选","First":"第一个","FirstView":"第一个视图","Folder":"文件夹","ForgotPassword":"忘记密码?","Forward":"前","GetMoreRows":"获取更多行","GreaterThan":"大于","GreaterThanOrEquals":"大于或等于","GridSettings":"网格设置","GroupSelection":"组选择","Help":"帮助","HideColumn":"隐藏列","IsEmpty":"为空","IsNotEmpty":"非空","Last":"最后一个","LastView":"最后一个视图","LaunchActivate":"启动/激活","LessThan":"小于","LessThanOrEquals":"小于或等于","Links":"链接","ListTabs":"列出所有选项卡","LoadingItem":"正在加载项目 ","Maintenance":"维护","Menu":"菜单","New":"新建","Next":"下一个","NextView":"下一个视图","No":"否","NotChecked":"未选中","Notes":"注释","NotSelected":"未选择","Of":" / ","Ok":"确定","Open":"打开","Password":"密码","Paste":"粘贴","Phone":"电话","PleaseWait":"请稍候","Previous":"上一个","PreviousView":"上一个视图","Print":"打印","Queries":"查询","Redo":"重做","Refresh":"刷新","Reject":"拒绝","RememberMe":"在本机记录我的登录信息","Reports":"报表","Reset":"重置","Review":"复查","RunFilter":"运行筛选器","RunJob":"运行作业","Save":"保存","SaveBeforeClosing":"先保存后关闭","SavedFilters":"保存的筛选器","SaveSubmit":"保存/提交","ScreenDesign":"屏幕设计","Search":"搜索","SelectContents":"选择内容","SelectDate":"选择日期","SelectDeselect":"全选/撤消全选","Selected":"选定: ","ServerName":"服务器名称","Settings":"设置","ShowFilterRow":"显示筛选行","SignIn":"登录","SortAscending":"升序排序","SortDescending":"降序排序","Spreadsheet":"电子表格","StartsWith":"起始值为","StatusIndicator":"状态指示符","Tasks":"任务","Today":"今天","Translate":"翻译","UserID":"用户 ID","Utilities":"实用工具","Yes":"是","Page":"第","Rows":"行","ShowingAll":"全部显示","SessionNavigation":"会话导航","ListAllMenuItems":"列出所有菜单项目","NoRecordsFound":"未找到记录","SearchTree":"搜索树形结构","Clear":"清除","DrillDown":"详查","Required":"需要该字段","Available":"可用:","Add":"添加","MoveDown":"下移","MoveUp":"上移","Remove":"删除","LastYear":"去年","NextMonth":"下月","NextWeek":"下周","NextYear":"明年","OneMonthAgo":"一个月前","OneWeekAgo":"一周前","SixMonthsAgo":"半年前","Time":"时间","CannotBeSelected":"不能选择这一行。","ResetToDefault":"重设为默认布局","CloseOtherTabs":"关闭其他选项卡","EmailValidation":"输入有效的电子邮件地址","UrlValidation":"输入有效的 URL","EndofResults":"结果末尾","More":"更多...","RecordsPerPage":"每页记录数","Maximize":"最大化","Minimize":"最小化","CloseAllTabs":"关闭所有选项卡","QuickDates":"快速日期","Finish":"完成","SetTextColor":"设置文本颜色","AttachmentRules":"附件规则","AutoRefresh":"自动刷新","BarChart":"条形图","CopyMail":"复制并发送邮件","CopyUrl":"复制 URL","DistributeHorizontally":"水平分布","ExpandAll":"全部展开","Generate":"生成","GenerateScript":"生成脚本","NoAttachments":"无附件","PieChart":"饼形图","QuickAccess":"快速访问","RestoreUser":"还原用户","SaveConsolidate":"保存时做本地合并","Screen Design":"屏幕设计","SelectAll":"全选","SpellCheck":"拼写检查","SubmitForApproval":"提交以便审批","TopDownSpread":"","Timezone":"时区","Loading":"正在加载...","NewNode":"新节点"}
});

}( this ));
