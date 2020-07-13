/*
* Infor Rich Text Editor
*/
(function ($) {
	$.fn.inforRichTextEditor = function(options) {

    // Settings and Options
    var pluginName = 'inforRichTextEditor',
        defaults = {
          buttons: [
			{icon: 'h2', execCommand: 'formatblock', args: 'h2', text: 'H2', isToggle: false},
			{icon: 'h3', execCommand: 'formatblock', args: 'h3', text: 'H3', isToggle: false},
			{icon: 'normal', execCommand: 'formatblock', args: 'p', text: 'normal', isToggle: false},
			{icon: 'spacer'},
			//{icon: 'formatblock', execCommand: 'fontname', title: 'Format'},
			{icon: 'forecolor', execCommand: 'forecolor', title: 'Font Color'},
			{icon: 'spacer'},
			{icon: 'bold', execCommand: 'bold', title: 'Make Text Bold', isToggle: true},
			{icon: 'italic', execCommand: 'italic', title: 'Make Text Italicized', isToggle: true },
			{icon: 'underline', execCommand: 'underline', title: 'Make Text Underlined', isToggle: true },
			{icon: 'spacer'},
			{icon: 'justifyLeft', execCommand: 'justifyLeft', title: 'Align Content Left'},
			{icon: 'justifyCenter', execCommand: 'justifyCenter', title: 'Align Content Center'},
			{icon: 'justifyRight', execCommand: 'justifyRight', title: 'Align Content Right'},
			{icon: 'spacer'},
            //{icon: 'blockQuote', execCommand: 'formatblock', title: 'Block Quote', args: 'blockquote', text: '“'},
            {icon: 'numberList', execCommand: 'insertorderedlist', title: 'Create a Numbered List'},
            {icon: 'bulletList', execCommand: 'insertunorderedlist', title: 'Create a Bulleted List'},
            {icon: 'spacer'},
            {icon: 'links', execCommand: 'createLink', title: 'Create a Link', click: function(e, self) {self.insertLink($(e.currentTarget));}},
			{icon: 'spacer'},
            {icon: 'showHtml', execCommand: 'showHtml', title: 'Show Html', isToggle: true}
            ]
        },
        settings = $.extend({}, defaults, options);

    // Plugin Constructor
    function Plugin(element) {
        this.element = $(element);
        this.init();
    }

    // Actual Plugin Code
    Plugin.prototype = {
      init: function(){
				var self = this,
					editor = $(this.element);

				//Make it Content Editable
				editor.addClass('inforRichTextEditor').attr('contenteditable', true);

				//Add the Toolbar Buttons
				self.addButtons();

				//Handle Readonly
				if (editor.attr('readonly')) {	//Was initialized in hidden state
					editor.prev('.inforToolbar').hide();
					editor.attr('contenteditable', 'false');
				}

				//Setup keys
				self.handleKeys();
      },
      _saveSelection: function () {
				var sel;
				if (window.getSelection) {
					sel = window.getSelection();
					if (sel.getRangeAt && sel.rangeCount) {
						var ranges = [];
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                ranges.push(sel.getRangeAt(i));
            }
			return ranges;
          }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
				}
				return null;
		},
		_restoreSelection: function (range) {
			var sel;
			if (range) {
				if (window.getSelection) {
					sel = window.getSelection();
					sel.removeAllRanges();
					for (var i = 0, len = range.length; i < len; ++i) {
              sel.addRange(range[i]);
          }
				} else if (document.selection && range.select) {
					range.select();
        }
      }
    },
	insertLink: function (url) {
		
		//First add the html to the page..
		$("body").append('<div id="_newHTMLLink" style="display:none"><label class="inforLabel" for="_newHTMLLinkURL">URL</label><input style="width:300px" id="_newHTMLLinkURL" class="inforTextbox"/><br/><br/></div>');
		var self = this;
		self.selection = self._saveSelection();
		
		
		
		//Invoke the dialog on it
		$('#_newHTMLLink').inforMessageDialog({
			title: "Insert Url",
			dialogType: "General",
			width: 400,
			height: "auto",
			modal: true,
			beforeClose: function() {
				//do something and return false to cancel closing
			},
			close: function(event, ui) {
				$('#_newHTMLLink').remove();
				self._restoreSelection(self.selection);
			},
			buttons: [{
				id: 'InsertButton',
				text: "Insert",
				click: function() {
					self._restoreSelection(self.selection);
					$("#InsertButton").addClass("active");
					var linkURL = $(this).find("#_newHTMLLinkURL").val();
					var text = window.document.getSelection();
					if (!text)
					{
						text = linkURL;
					}
					window.document.execCommand('insertHTML', false, '<a href="' + linkURL + '" target="_blank">' + text + '</a>');
					$(this).inforDialog("close");
					},
					isDefault: true
			 },{
				text: Globalize.localize("Cancel"),
				click: function() {
					$(this).inforDialog("close"); }
			 }]
		});
	
		$('#_newHTMLLink').inforForm();
		$(document).find("#_newHTMLLinkURL").val('');
      },
    addButtons: function () {
      var self = this,
            html = '',
						editor = $(this.element),
						tb, container;

					container = $('<div class="inforRichTextContainer"></div>');
					if (editor.attr('id')) {
						container.attr('id', editor.attr('id') + 'Container');
					}

					if (editor.css('position') === 'absolute') {
						container.css({position: 'absolute', left: editor.css('left'), top: editor.css('top'), bottom: editor.css('bottom')});
						editor.css({position: '', left: '', top: '', bottom: ''});
					}

					editor.wrap(container);
					tb = $('<div class="inforToolbar inforRTToolbar" ></div>').insertBefore(editor);
          editor.on('blur', function () {
            self.selection = self._saveSelection();
            setTimeout(function () {
				if (document.activeElement.tagName != "INPUT")
				{
					self._restoreSelection(self.selection);
				}
            }, 1);
          });

					//Create buttons
					self.buttons = [];
					$.each(settings.buttons, function (name, props) {
						if (props.icon ==='spacer') {
							$('<span class="inforToolbarSpacer"></span>').appendTo(tb);
							return;
						}
						/*
						if (props.icon === 'formatblock') {
							html = '<select class="inforDropDownList" style="width: 70px"> <option value="<h2>">Heading 2</option> <option value="<h3>">Heading 3</option> <option value="<p>">Normal</option> </select>';
							//add color picker
							self.fontsize = $(html).appendTo(tb);
							self.fontsize.inforDropDownList({editable: false, noFocus: true, autoFocus: false, typeAheadSearch: false})
							.on('change', function() {
								var format = this[this.selectedIndex].value;
								setTimeout(function () {
									self._restoreSelection(self.selection);
									document.execCommand('formatblock', false, format);
								}, 1);
							});
							return;
						}*/

						if (props.icon === 'forecolor') {
							//add color picker
							self.colorpicker = $('<input type="text" class="inforColorPicker" >').appendTo(tb);
							self.colorpicker.inforColorPicker().change(function() {
								$(self.element).focus();
								document.execCommand('forecolor', false, $(this).val());
							});
							var picker = self.colorpicker.closest('.inforTriggerField');
							picker.find('input').hide();
							picker.find('.inforColorButton')
								.attr('style', 'border-right: none !important; margin-left: -1px !important')
								.attr('title', Globalize.localize('SetTextColor')).inforToolTip();
							return;
						}

						var button = $('<button type="button" class="inforIconButton"><span></span></button>').appendTo(tb)
						.click(function (e) {
							$(self.element).focus();
							if (props.click) {
								props.click(e, self);
								return;
							}

              var isIE = ((navigator.appName === 'Microsoft Internet Explorer') || ((navigator.appName === 'Netscape') && (new RegExp('Trident/.*rv:([0-9]{1,}[.0-9]{0,})').exec(navigator.userAgent) !== null)));
              var el = props.args || null;

              if (isIE) {
                if (el === 'blockquote') {
                    return document.execCommand('indent', false, el);
                }
				if (el) {
					el = '<' + el + '>';
				}
              }

              document.execCommand(props.execCommand, false, el);
							$(self.element).focus();

							if (props.isToggle) {
								$(this).toggleClass('checked');
							}
							
							window.setTimeout(function()
							{
								$(self.element).focus();
							}, 10);
						})
						.addClass(props.icon)
						.addClass(props.isToggle ? 'inforToggleButton' : '')
						.attr('title', props.title).inforToolTip();

						if (props.text) {
							button.html(props.text);
						}

						if (props.icon === 'showHtml') {
							var id = editor.attr('id') + 'HtmlView';
							self.sourceView = $('<label for="' + id + '">Html View</label><textarea class="inforRichTextHtmlView" id="'+ id +'">').appendTo(editor.parent()).hide();

              button.html('HTML').on('click', function() {
                var btn = $(this);
				var isSourceView = self.sourceView.is(':visible');
                if (isSourceView) {
                  self.sourceView.hide();
				  editor.html($("#" + id).val().trim());
                  editor.show();
                  btn.removeClass('checked');
                } else {
                  self.sourceView.show();
				  $("#" + id).val(editor.html().trim());
                  editor.hide();
                  btn.addClass('checked');
                }

							});
						}

						self.buttons.push({id: props.icon, button: button});
					});
      },
      handleKeys: function () {
				var elem = this.element,
					self = this;

				elem.on('keyup.richtext', function() {
					self.setButtonStates();
				}).on('mouseup.richtext', function() {
					self.setButtonStates();
				});
			},
			setButtonStates: function() {
				this.testButtonState('bold');
				this.testButtonState('italic');
				this.testButtonState('underline');
			},
			testButtonState: function(command) {
				var elem;
				if (!document.queryCommandState) {
					return;
				}

				elem = $.grep(this.buttons, function(e){ return e.id === command; });
				if (!elem[0].button) {
					return;
				}

				if (document.queryCommandState(command)) {
					elem[0].button.addClass('checked');
				} else {
					elem[0].button.removeClass('checked');
				}
			}
    };

    // Support Chaining and Init the Control or Set Settings
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (instance) {
        instance.settings = $.extend({}, defaults, options);
      } else {
        instance = $.data(this, pluginName, new Plugin(this, settings));
      }
    });
  };
})(jQuery);
