/*
 * Globalize Culture ko-KR
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

Globalize.addCultureInfo( "ko-KR", "default", {
	name: "ko-KR",
	englishName: "Korean (Korea)",
	nativeName: "한국어 (대한민국)",
	language: "ko",
	numberFormat: {
		currency: {
			pattern: ["-$n","$n"],
			decimals: 0,
			symbol: "₩"
		}
	},
	calendars: {
		standard: {
			"/": "-",
			days: {
				names: ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"],
				namesAbbr: ["일","월","화","수","목","금","토"],
				namesShort: ["일","월","화","수","목","금","토"]
			},
			months: {
				names: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월",""],
				namesAbbr: ["1","2","3","4","5","6","7","8","9","10","11","12",""]
			},
			AM: ["오전","오전","오전"],
			PM: ["오후","오후","오후"],
			eras: [{"name":"서기","start":null,"offset":0}],
			patterns: {
				d: "yyyy-MM-dd",
				D: "yyyy'년' M'월' d'일' dddd",
				t: "tt h:mm",
				T: "tt h:mm:ss",
				f: "yyyy'년' M'월' d'일' dddd tt h:mm",
				F: "yyyy'년' M'월' d'일' dddd tt h:mm:ss",
				M: "M'월' d'일'",
				Y: "yyyy'년' M'월'"
			}
		},
		Korean: {
			name: "Korean",
			"/": "-",
			days: {
				names: ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"],
				namesAbbr: ["일","월","화","수","목","금","토"],
				namesShort: ["일","월","화","수","목","금","토"]
			},
			months: {
				names: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월",""],
				namesAbbr: ["1","2","3","4","5","6","7","8","9","10","11","12",""]
			},
			AM: ["오전","오전","오전"],
			PM: ["오후","오후","오후"],
			eras: [{"name":"단기","start":null,"offset":-2333}],
			twoDigitYearMax: 4362,
			patterns: {
				d: "gg yyyy-MM-dd",
				D: "gg yyyy'년' M'월' d'일' dddd",
				t: "tt h:mm",
				T: "tt h:mm:ss",
				f: "gg yyyy'년' M'월' d'일' dddd tt h:mm",
				F: "gg yyyy'년' M'월' d'일' dddd tt h:mm:ss",
				M: "M'월' d'일'",
				Y: "gg yyyy'년' M'월'"
			}
		}
	},
	messages: {"AdditionalHelp":"추가 도움말","AddNewTab":"새 탭 추가","Alerts":"경고","ApplyFilter":"필터 적용","Approve":"승인","Attachments":"첨부 파일","Back":"뒤로","Basic":"기본","Between":"중간","Book":"책","Cancel":"취소","Checked":"확인됨","ClearFilter":"필터 지우기","Close":"닫기","CloseCancelChanges":"닫은 후 변경 내용 취소","CloseSaveChanges":"닫은 후 변경 내용 저장","CloseTab":"탭 닫기","ColumnPersonalization":"열 개인 설정","Comments":"댓글","Confirmation":"확인","Contains":"포함","CreateTab":"새 탭 만들기","Cut":"잘라내기","Delete":"삭제","DiscardUndo":"삭제/실행 취소","DisplayDropDownList":"드롭다운 목록 표시","Displaying":"표시: ","DocWord":"문서","DoesNotContain":"포함하지 않음","DoesNotEndWith":"제외할 끝 문자","DoesNotEqual":"같지 않음","DoesNotStartWith":"제외할 시작 문자","Download":"다운로드","Duplicate":"복제","Edit":"편집","EitherSelectedorNotSelected":"선택한 사항 또는 선택하지 않은 사항","Email":"메일","EndsWith":"끝나는 값","EqualsStr":"같음","ExpandCollapse":"확장/축소","ExportFailed":"내보내기 실패","ExportToExcel":"Excel로 내보내기","FileInUse":"지정된 파일이 사용 중임","FileInUseDetail":"애플리케이션에서 사용 중인 파일을 닫고 다른 파일 이름을 지정하십시오.","Filter":"필터","FilterMenu":"필터 메뉴","FilterOptions":"필터 옵션","FilterWithinResults":"결과 내 필터","First":"첫 번째","FirstView":"첫 번째 보기","Folder":"폴더","ForgotPassword":"암호를 잊으셨습니까?","Forward":"앞으로","GetMoreRows":"추가 행 얻기","GreaterThan":"다음 값보다 큼","GreaterThanOrEquals":"크거나 같음","GridSettings":"눈금 설정","GroupSelection":"그룹 선택","Help":"도움말","HideColumn":"열 숨기기","IsEmpty":"비어 있음","IsNotEmpty":"비어 있지 않음","Last":"최종","LastView":"최종 보기","LaunchActivate":"시작/활성화","LessThan":"보다 작음","LessThanOrEquals":"작거나 같음","Links":"링크","ListTabs":"모든 탭 나열","LoadingItem":"항목을 로드하는 중 ","Maintenance":"유지 관리","Menu":"메뉴","New":"새로 만들기","Next":"다음","NextView":"다음 보기","No":"아니요","NotChecked":"확인되지 않음","Notes":"참고","NotSelected":"선택되지 않음","Of":" / ","Ok":"확인","Open":"열기","Password":"암호","Paste":"붙여넣기","Phone":"전화","PleaseWait":"기다려 주십시오.","Previous":"이전","PreviousView":"이전 보기","Print":"인쇄","Queries":"쿼리","Redo":"다시 실행","Refresh":"새로 고침","Reject":"거부","RememberMe":"이 컴퓨터에 사용자 이름 및 암호 저장","Reports":"보고서","Reset":"다시 설정","Review":"검토","RunFilter":"필터 실행","RunJob":"작업 실행","Save":"저장","SaveBeforeClosing":"저장 후 닫기","SavedFilters":"저장된 필터","SaveSubmit":"저장/제출","ScreenDesign":"화면 설계","Search":"검색","SelectContents":"내용 선택","SelectDate":"날짜 선택","SelectDeselect":"모두 선택/선택 취소","Selected":"선택한 항목: ","ServerName":"서버 이름","Settings":"설정","ShowFilterRow":"필터 행 표시","SignIn":"로그인","SortAscending":"오름차순 정렬","SortDescending":"내림차순 정렬","Spreadsheet":"스프레드시트","StartsWith":"시작 문자","StatusIndicator":"상태 표시기","Tasks":"작업","Today":"오늘","Translate":"변환","UserID":"사용자 ID","Utilities":"유틸리티","Yes":"예","Page":"페이지","Rows":"행","ShowingAll":"모두 표시","SessionNavigation":"세션 탐색","ListAllMenuItems":"모든 메뉴 항목 나열","NoRecordsFound":"레코드 없음","SearchTree":"검색 트리","Clear":"지우기","DrillDown":"드릴다운","Required":"이 필드는 필수 필드입니다.","Available":"사용 가능:","Add":"추가","MoveDown":"아래로 이동","MoveUp":"위로 이동","Remove":"제거","LastYear":"작년","NextMonth":"다음 달","NextWeek":"다음 주","NextYear":"다음 해","OneMonthAgo":"한 달 전","OneWeekAgo":"일주일 전","SixMonthsAgo":"6개월 전","Time":"시간","CannotBeSelected":"이 행을 선택할 수 없습니다.","ResetToDefault":"기본 레이아웃으로 다시 설정","CloseOtherTabs":"다른 탭 닫기","EmailValidation":"올바른 메일 주소 입력","UrlValidation":"올바른 URL 입력","EndofResults":"결과 끝","More":"추가...","RecordsPerPage":"페이지당 레코드 수","Maximize":"최대화","Minimize":"최소화","CloseAllTabs":"모든 탭 닫기","QuickDates":"빠른 날짜","Finish":"마침","SetTextColor":"텍스트 색상 설정","AttachmentRules":"첨부 규칙","AutoRefresh":"자동 새로 고침","BarChart":"막대형 차트","CopyMail":"복사 후 메일 보내기","CopyUrl":"URL 복사","DistributeHorizontally":"가로 간격을 동일하게","ExpandAll":"모두 확장","Generate":"생성","GenerateScript":"스크립트 생성","NoAttachments":"첨부 파일 없음","PieChart":"원형 차트","QuickAccess":"빠른 액세스","RestoreUser":"사용자 복원","SaveConsolidate":"로컬 통합으로 저장","Screen Design":"화면 설계","SelectAll":"모두 선택","SpellCheck":"맞춤법 검사","SubmitForApproval":"승인을 위해 제출","Timezone":"시간대","Loading":"로드하는 중...","NewNode":"새 노드","RememberSettings":"이 설정 저장","Company":"회사","Environment":"환경","DontHaveAccount":"계정이 없으십니까?","ResetPassword":"내 암호 다시 설정","SignUpNow":"지금 등록","SelectMonthYear":"월 및 연도 선택"}
});

}( this ));
