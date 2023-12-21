/*
* Collection of Shared Bindings for use in KnockOut
*/
$(function () {

	//only add this if knockout is present..
	if (typeof ko === "undefined") {
		return;
	}

	/* Provide the ability to translate and change text bindings on buttons.
	* Note: could also pass in a literal here: translate: 'SearchTreex'
	*/
	ko.bindingHandlers.translate = {
		setText: function(element, valueAccessor){
			var key = ko.utils.unwrapObservable(valueAccessor()),
				translatedText = Globalize.localize(key),
				text = (translatedText==undefined ? key  : translatedText);
			
			if ($(element).find(".innerText").length > 0) {
				$(element).find(".innerText").text(text);
			} else {
				$(element).text(text);
			}
		},
		init: function(element, valueAccessor) {
			ko.bindingHandlers.translate.setText(element, valueAccessor);
		},
		update: function(element, valueAccessor) {
		ko.bindingHandlers.translate.setText(element, valueAccessor);
		}
	};

	/* Provide the ability to bind the code value..
	*/
	ko.bindingHandlers.inforDropDownList = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
			
			//set the data
			ko.bindingHandlers.inforDropDownList.setData(elem, opts);
			
			//init the control
			if (opts.options) {
				elem.inforDropDownList(opts.options);
			} else if (!elem.data("uiInforDropDownList")) {
				elem.inforDropDownList();
			}
			
			//set the value
			if (opts.value) {
				elem.inforDropDownList("setCode", valueAccessor().value(), true);
			}
			
			//Setup events
			ko.utils.registerEventHandler(element, "change", function() { 
				var value = valueAccessor().value;
				value($(this).val());
			});
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
			
			if (opts.data) {
				ko.bindingHandlers.inforDropDownList.setData(elem, opts);
			}
			$(element).inforDropDownList("setCode", ko.utils.unwrapObservable(opts.value), true);
		},
		setData: function(elem, opts) {
			if (opts.data) {
				var data = ko.utils.unwrapObservable(opts.data);
				elem.empty();
				for (var i=0; i < data.length; i++) {
					var opt = $("<option></option").attr("value", (opts.optionsValue ? data[i][opts.optionsValue] : data[i].key)).html((opts.optionsText ? data[i][opts.optionsText] : data[i].name));
					elem.append(opt);
				}
			}
		}
	};
	
	ko.bindingHandlers.inforSlider = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
				
			//Setup events
			ko.utils.registerEventHandler(element, "slidechange", function(e, ui) { 
				var value = valueAccessor().value;
				value(ui.value);
			});
			
			//init the control
			if (opts.options) {
				elem.inforSlider(opts.options);
			} else if (!elem.data("uiInforSlider")) {
				elem.inforSlider();
			}
			
			//set the value
			if (opts.value) {
				elem.data("uiInforSlider").value(ko.utils.unwrapObservable(opts.value));
			}
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
			
			elem.data("uiInforSlider").value(ko.utils.unwrapObservable(opts.value));
		}
	};
	
	ko.bindingHandlers.inforRadioButton = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
				
			//Setup events
			ko.utils.registerEventHandler(element, "change", function() { 
				var value = valueAccessor().value;
				value($(this).getValue());
			});
			
			//init the control
			if (!elem.data("uiInforRadioButton")) {
				elem.find("input").inforRadioButton();
			}
				
			//set the value
			if (opts.value) {
				elem.setValue(ko.utils.unwrapObservable(opts.value));
			}
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
				
			elem.setValue(ko.utils.unwrapObservable(opts.value));
		}
	};
	
	ko.bindingHandlers.inforFileField = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
				
			//Setup events
			ko.utils.registerEventHandler(element, "change", function() { 
				var value = valueAccessor().value;
				value($(this).getValue());
			});
			
			//init the control
			if (!elem.data("uiInforFileField")) {
				elem.inforFileField();
			}
				
			//set the value
			if (opts.value) {
				elem.parent().find(".fileInputField").val(ko.utils.unwrapObservable(opts.value));
			}
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
				
			elem.parent().find(".fileInputField").val(ko.utils.unwrapObservable(opts.value));
		}
	};
	
	ko.bindingHandlers.inforDateField = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
				
			//Setup events
			ko.utils.registerEventHandler(element, "change", function() { 
				var value = valueAccessor().value;
				value($(this).val());
			});
			
			//init the control
			if (!elem.data("uiInforDateField")) {
				elem.inforDateField();
			}
				
			//set the value
			if (opts.value) {
				elem.val(ko.utils.unwrapObservable(opts.value));
			}
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			var opts = ko.utils.unwrapObservable(valueAccessor()),
				elem = $(element);
				
			elem.val(ko.utils.unwrapObservable(opts.value));
		}
	};
	
	/* Util to Copy a Binding from one object to another and optionally remove it*/
	ko.copyBinding = function( fromObject, toObject, binding, remove ) {
		//Get the attributes from the source object
		var attr = fromObject.attr("data-bind"),
			found = false;

		if (!attr)
			return;

		var seperated = attr.split(",");	//Separate them
		for (attr in seperated) {
			var attrPair = $.trim(seperated[attr]);
			if (attrPair.indexOf(binding+":")==0) {
				//found copy it
				var old = toObject.attr("data-bind");
				toObject.attr("data-bind",(old == undefined ? attrPair : old+","+attrPair));
				//remove it from the array
				delete seperated[attr];
				found = true;
			}
		}

		if (remove && found) {
			var newAttr =seperated.toString();
			if (newAttr.substring(newAttr.length-1)==",")
				newAttr = newAttr.substring(0, newAttr.length-1);

			newAttr = newAttr.replace(/,,/gi, ",");
			fromObject.attr("data-bind",newAttr);
		}
	}

});