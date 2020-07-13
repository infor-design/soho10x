/*
* Infor UI Slider
*
* Mostly Based on jqueryUi Slider
*
* Copyright 2012 jQuery Foundation and other contributors
* Released under the MIT license.
* http://jquery.org/license
*/
(function ($, undefined) {

    // number of pages in a slider
    // (how many times can you page up/down to go through the whole range)
    var numPages = 5;

    $.widget("ui.inforSlider", $.ui.mouse, {
        widgetEventPrefix: "slide",

        options: {
            animate: true,
            distance: 0,
            max: 100,
            min: 0,
            orientation: "horizontal",
            range: "min",
            step: 1,
            value: 0,
            values: null,
            showValueLabel: true,
            showMinMaxLabel: false,
            showSteps: false
        },

        _create: function () {
            var i, handleCount,
				o = this.options,
				existingHandles = this.element.find(".inforSliderHandle"),
				handle = "<a class='inforSliderHandle' role='slider' href='#'></a>",
				handles = [],
				self = this;

            this._keySliding = false;
            this._mouseSliding = false;
            this._animateOff = true;
            this._handleIndex = null;
            this._detectOrientation();
            this._mouseInit();

            this.element
				.addClass("inforSlider" +
				" " + this.orientation + " " + (o.range === true ? "range" : "") +
				(o.disabled ? " inforSliderDisabled" : ""));//.css("width", "100%");

            this.range = $([]);

            if (o.range) {
                if (o.range === true) {
                    if (!o.values) {
                        o.values = [this._valueMin(), this._valueMin()];
                    }
                    if (o.values.length && o.values.length !== 2) {
                        o.values = [o.values[0], o.values[0]];
                    }
                }

                this.range = $("<div></div>")
					.appendTo(this.element)
					.addClass("inforSliderRange" +
					((o.range === "min" || o.range === "max") ? " inforSliderRange " + o.range : ""));
            }

            handleCount = (o.values && o.values.length) || 1;

            for (i = existingHandles.length; i < handleCount; i++) {
                handles.push(handle);
            }

            this.handles = existingHandles.add($(handles.join("")).appendTo(this.element));

            this.handle = this.handles.eq(0);

            this.handles.add(this.range).filter("a")
				.click(function (event) {
				    event.preventDefault();
				})
				.mouseenter(function () {
				    if (!o.disabled) {
				        $(this).addClass("hover").parent().addClass("hover");
				    }
				})
				.mouseleave(function () {
				    $(this).removeClass("hover").parent().removeClass("hover");
				})
				.focus(function () {
				    if (!o.disabled) {
				        $(".inforSlider .focus").removeClass("focus");
				        $(this).addClass("focus").parent().addClass("focus");
				        $(self.labels).each(function () {
				            $(this).addClass("sliding");
				        });
				    } else {
				        $(this).blur();
				    }
				})
				.blur(function () {
				    $(this).removeClass("focus").parent().removeClass("focus");
				    $(self.labels).each(function () {
				        $(this).removeClass("sliding");
				    });
				});

            this.handles.each(function (i) {
                $(this).data("uiInforSliderHandleIndex", i);
            });

            this._on(this.handles, {
                keydown: function (event) {
                    var allowed, curVal, newVal, step,
						index = $(event.target).data("uiInforSliderHandleIndex");

                    switch (event.keyCode) {
                        case $.ui.keyCode.HOME:
                        case $.ui.keyCode.END:
                        case $.ui.keyCode.PAGE_UP:
                        case $.ui.keyCode.PAGE_DOWN:
                        case $.ui.keyCode.UP:
                        case $.ui.keyCode.RIGHT:
                        case $.ui.keyCode.DOWN:
                        case $.ui.keyCode.LEFT:
                            event.preventDefault();
                            if (!this._keySliding) {
                                this._keySliding = true;
                                $(event.target).addClass("ui-state-active");
                                allowed = this._start(event, index);
                                if (allowed === false) {
                                    return;
                                }
                            }
                            break;
                    }

                    step = this.options.step;
                    if (this.options.values && this.options.values.length) {
                        curVal = newVal = this.values(index);
                    } else {
                        curVal = newVal = this.value();
                    }

                    switch (event.keyCode) {
                        case $.ui.keyCode.HOME:
                            newVal = this._valueMin();
                            break;
                        case $.ui.keyCode.END:
                            newVal = this._valueMax();
                            break;
                        case $.ui.keyCode.PAGE_UP:
                            newVal = this._trimAlignValue(curVal + ((this._valueMax() - this._valueMin()) / numPages));
                            break;
                        case $.ui.keyCode.PAGE_DOWN:
                            newVal = this._trimAlignValue(curVal - ((this._valueMax() - this._valueMin()) / numPages));
                            break;
                        case $.ui.keyCode.UP:
                        case $.ui.keyCode.RIGHT:
                            if (curVal === this._valueMax()) {
                                return;
                            }
                            newVal = this._trimAlignValue(curVal + step);
                            break;
                        case $.ui.keyCode.DOWN:
                        case $.ui.keyCode.LEFT:
                            if (curVal === this._valueMin()) {
                                return;
                            }
                            newVal = this._trimAlignValue(curVal - step);
                            break;
                    }

                    this._slide(event, index, newVal);
                },
                keyup: function (event) {
                    var index = $(event.target).data("uiInforSliderHandleIndex");

                    if (this._keySliding) {
                        this._keySliding = false;
                        this._stop(event, index);
                        this._change(event, index);
                        $(event.target).removeClass("ui-state-active");
                    }
                }
            });

            if (o.showValueLabel) {
                this.labels = [];
                this.labels[0] = $('<span class="inforSliderLabel">0</span>').insertAfter(this.handles[0]);
                if (o.range) {
                    this.labels[1] = $('<span class="inforSliderLabelRight">0</span>').insertAfter(this.handles[1]);
                }
            }

            if (o.showSteps) {
                this.stepLabels = [], this.stepTicks = [];
                var count = 0;
                for (i = o.min; i <= o.max; i += o.step) {
                    var tickPercent = (100 * o.step / (o.max * o.step)) * count;
                    if (Globalize.culture().isRTL) {
                        tickPercent = 100 - tickPercent;
                    }
                    this.stepLabels[count] = $('<span class="inforSliderLabel">' + count + '</span>').css({ "left": tickPercent + "%"}).insertBefore(this.handles[0]);
                    this.stepTicks[count] = $('<span class="inforSliderTick" tabindex="-1"></span>').css({ "left": tickPercent + "%"}).insertBefore(this.handles[0]);
                    this.stepTicks[count].perc = (100 * o.step / (o.max * o.step)) * count;
                    count++;
                }
            }

            if (o.showMinMaxLabel) {
                var rangeLabelFloat = (Globalize.culture().isRTL && o.orientation === "horizontal") ? 'right' : 'left';
                this.rangeLabels = [];
                this.rangeLabels[0] = $('<span class="inforSliderRangeLabel" style="float:' + rangeLabelFloat + '">' + o.min + '</span>').insertBefore(this.handles[0]);
                this.rangeLabels[1] = $('<span class="inforSliderRangeLabel">' + o.max + '</span>').insertAfter(this.handles[0]);
            }
            this._refreshValue();
            this._animateOff = false;
        },
        _destroy: function () {
            this.handles.remove();
            this.range.remove();

            this.element
				.removeClass("inforSlider" +
				" inforSliderHorizontal" +
				" inforSliderVertical" +
				" inforSliderDisabled");

            this._mouseDestroy();
        },

        _mouseCapture: function (event) {
            var position, normValue, distance, closestHandle, index, allowed, offset, mouseOverHandle,
				that = this,
				o = this.options;

            if (o.disabled) {
                return false;
            }

            this.elementSize = {
                width: this.element.outerWidth(),
                height: this.element.outerHeight()
            };
            this.elementOffset = this.element.offset();

            position = { x: event.pageX, y: event.pageY };
            normValue = this._normValueFromMouse(position);
            distance = this._valueMax() - this._valueMin() + 1;
            this.handles.each(function (i) {
                var thisDistance = Math.abs(normValue - that.values(i));
                if ((distance > thisDistance) ||
					(distance === thisDistance &&
						(i === that._lastChangedValue || that.values(i) === o.min))) {
                    distance = thisDistance;
                    closestHandle = $(this);
                    index = i;
                }
            });

            allowed = this._start(event, index);
            if (allowed === false) {
                return false;
            }
            this._mouseSliding = true;

            this._handleIndex = index;

            closestHandle
				.addClass("ui-state-active")
				.focus();

            offset = closestHandle.offset();
            mouseOverHandle = !$(event.target).parents().addBack().is(".inforSliderHandle");
            this._clickOffset = mouseOverHandle ? { left: 0, top: 0 } : {
                left: event.pageX - offset.left - (closestHandle.width() / 2),
                top: event.pageY - offset.top -
					(closestHandle.height() / 2) -
					(parseInt(closestHandle.css("borderTopWidth"), 10) || 0) -
					(parseInt(closestHandle.css("borderBottomWidth"), 10) || 0) +
					(parseInt(closestHandle.css("marginTop"), 10) || 0)
            };

            if (!this.handles.hasClass("ui-state-hover")) {
                this._slide(event, index, normValue);
            }
            this._animateOff = true;
            return true;
        },

        _mouseStart: function () {
            return true;
        },

        _mouseDrag: function (event) {
            var position = {
                x: event.pageX,
                y: event.pageY
            },
				normValue = this._normValueFromMouse(position);

            this._slide(event, this._handleIndex, normValue);

            return false;
        },

        _mouseStop: function (event) {
            this.handles.removeClass("ui-state-active");
            this._mouseSliding = false;

            this._stop(event, this._handleIndex);
            this._change(event, this._handleIndex);

            this._handleIndex = null;
            this._clickOffset = null;
            this._animateOff = false;

            return false;
        },

        _detectOrientation: function () {
            this.orientation = (this.options.orientation === "vertical") ? "vertical" : "horizontal";
        },

        _normValueFromMouse: function (position) {
            var pixelTotal,
				pixelMouse,
				percentMouse,
				valueTotal,
				valueMouse;

            if (this.orientation === "horizontal") {
                pixelTotal = this.elementSize.width;
                pixelMouse = position.x - this.elementOffset.left - (this._clickOffset ? this._clickOffset.left : 0);
            }

            percentMouse = (pixelMouse / pixelTotal);
            if (percentMouse > 1) {
                percentMouse = 1;
            }
            if (percentMouse < 0) {
                percentMouse = 0;
            }
            if (Globalize.culture().isRTL) {
                percentMouse = 1 - percentMouse;
            }

            valueTotal = this._valueMax() - this._valueMin();
            valueMouse = this._valueMin() + percentMouse * valueTotal;

            return this._trimAlignValue(valueMouse);
        },

        _start: function (event, index) {
            var uiHash = {
                handle: this.handles[index],
                value: this.value()
            };
            if (this.options.values && this.options.values.length) {
                uiHash.value = this.values(index);
                uiHash.values = this.values();
            }
            return this._trigger("start", event, uiHash);
        },

        _slide: function (event, index, newVal) {
            var otherVal,
				newValues,
				allowed;

            if (this.options.values && this.options.values.length) {
                otherVal = this.values(index ? 0 : 1);

                if ((this.options.values.length === 2 && this.options.range === true) &&
					((index === 0 && newVal > otherVal) || (index === 1 && newVal < otherVal))) {
                    newVal = otherVal;
                }

                if (newVal !== this.values(index)) {
                    newValues = this.values();
                    newValues[index] = newVal;
                    // A slide can be canceled by returning false from the slide callback
                    allowed = this._trigger("slide", event, {
                        handle: this.handles[index],
                        slider: $(this.handles[index]).parent(),
                        value: newVal,
                        values: newValues
                    });

                    otherVal = this.values(index ? 0 : 1);
                    if (allowed !== false) {
                        this.values(index, newVal, true);
                    }
                }
            } else {
                if (newVal !== this.value()) {
                    // A slide can be canceled by returning false from the slide callback
                    allowed = this._trigger("slide", event, {
                        handle: this.handles[index],
                        slider: $(this.handles[index]).parent(),
                        value: newVal
                    });

                    if (allowed !== false) {
                        this.value(newVal);
                    }
                }
            }
        },

        _stop: function (event, index) {
            var uiHash = {
                handle: this.handles[index],
                value: this.value()
            };
            if (this.options.values && this.options.values.length) {
                uiHash.value = this.values(index);
                uiHash.values = this.values();
            }

            this._trigger("stop", event, uiHash);
        },

        _change: function (event, index) {
            if (!this._keySliding && !this._mouseSliding) {
                var uiHash = {
                    handle: this.handles[index],
                    value: this.value()
                };
                if (this.options.values && this.options.values.length) {
                    uiHash.value = this.values(index);
                    uiHash.values = this.values();
                }

                this._trigger("change", event, uiHash);
            }
        },

        value: function (newValue) {
            if (arguments.length) {
                this.options.value = this._trimAlignValue(newValue);
                this._refreshValue();
                this._change(null, 0);
                return;
            }

            return this._value();
        },

        values: function (index, newValue) {
            var vals,
				newValues,
				i;

            if (arguments.length > 1) {
                this.options.values[index] = this._trimAlignValue(newValue);
                this._refreshValue();
                this._change(null, index);
                return;
            }

            if (arguments.length) {
                if ($.isArray(arguments[0])) {
                    vals = this.options.values;
                    newValues = arguments[0];
                    for (i = 0; i < vals.length; i += 1) {
                        vals[i] = this._trimAlignValue(newValues[i]);
                        this._change(null, i);
                    }
                    this._refreshValue();
                } else {
                    if (this.options.values && this.options.values.length) {
                        return this._values(index);
                    } else {
                        return this.value();
                    }
                }
            } else {
                return this._values();
            }
        },

        _setOption: function (key, value) {
            var i,
				valsLength = 0;

            if ($.isArray(this.options.values)) {
                valsLength = this.options.values.length;
            }

            $.Widget.prototype._setOption.apply(this, arguments);

            switch (key) {
                case "disabled":
                    if (value) {
                        this.handles.filter(".ui-state-focus").blur();
                        this.handles.removeClass("ui-state-hover");
                        this.handles.prop("disabled", true);
                        this.element.addClass("ui-disabled");
                    } else {
                        this.handles.prop("disabled", false);
                        this.element.removeClass("ui-disabled");
                    }
                    break;
                case "value":
                    this._animateOff = true;
                    this._refreshValue();
                    this._change(null, 0);
                    this._animateOff = false;
                    break;
                case "values":
                    this._animateOff = true;
                    this._refreshValue();
                    for (i = 0; i < valsLength; i += 1) {
                        this._change(null, i);
                    }
                    this._animateOff = false;
                    break;
                case "min":
                case "max":
                    this._animateOff = true;
                    this._refreshValue();
                    this._animateOff = false;
                    break;
            }
        },

        //internal value getter
        // _value() returns value trimmed by min and max, aligned by step
        _value: function () {
            var val = this.options.value;
            val = this._trimAlignValue(val);

            return val;
        },

        //internal values getter
        // _values() returns array of values trimmed by min and max, aligned by step
        // _values( index ) returns single value trimmed by min and max, aligned by step
        _values: function (index) {
            var val,
				vals,
				i;

            if (arguments.length) {
                val = this.options.values[index];
                val = this._trimAlignValue(val);

                return val;
            } else {
                // .slice() creates a copy of the array
                // this copy gets trimmed by min and max and then returned
                vals = this.options.values.slice();
                for (i = 0; i < vals.length; i += 1) {
                    vals[i] = this._trimAlignValue(vals[i]);
                }

                return vals;
            }
        },

        // returns the step-aligned value that val is closest to, between (inclusive) min and max
        _trimAlignValue: function (val) {
            if (val <= this._valueMin()) {
                return this._valueMin();
            }
            if (val >= this._valueMax()) {
                return this._valueMax();
            }
            var step = (this.options.step > 0) ? this.options.step : 1,
				valModStep = (val - this._valueMin()) % step,
				alignValue = val - valModStep;

            if (Math.abs(valModStep) * 2 >= step) {
                alignValue += (valModStep > 0) ? step : (-step);
            }

            // Since JavaScript has problems with large floats, round
            // the final value to 5 digits after the decimal point (see #4124)
            return parseFloat(alignValue.toFixed(5));
        },

        _valueMin: function () {
            return this.options.min;
        },

        _valueMax: function () {
            return this.options.max;
        },

        _refreshValue: function () {
            var lastValPercent, valPercent, value, valueMin, valueMax,
				oRange = this.options.range,
				o = this.options,
				self = this,
				i,
				that = this,
				animate = (!this._animateOff) ? o.animate : false,
				_set = {},
		        sliderHandleDirection = Globalize.culture().isRTL ? 'right' : 'left';

            if (this.options.values && this.options.values.length) {
                this.handles.each(function (i) {
                    valPercent = (that.values(i) - that._valueMin()) / (that._valueMax() - that._valueMin()) * 100;
                    _set[that.orientation === "horizontal" ? sliderHandleDirection : "bottom"] = valPercent + "%";
                    $(this).stop(1, 1)[animate ? "animate" : "css"](_set, o.animate);
                    this.handle.attr("aria-valuemin", that._valueMin())
						.attr("aria-valuemax", that._valueMax())
						.attr("aria-valuenow", valPercent)
						.attr("aria-valuetext", valPercent)
						.attr("aria-labelledby", valPercent);

                    if (that.options.range === true) {
                        if (that.orientation === "horizontal") {
                            if (i === 0) {
                                var sliderHandleCss = Globalize.culture().isRTL ? { right: valPercent + "%" } : { left: valPercent + "%" }
                                that.range.stop(1, 1)[animate ? "animate" : "css"](sliderHandleCss, o.animate);
                            }
                            if (i === 1) {
                                that.range[animate ? "animate" : "css"]({
                                    width: (valPercent - lastValPercent) + "%"
                                }, {
                                    queue: false,
                                    duration: o.animate
                                });
                            }
                        }
                    }
                    if (o.showValueLabel) {
                        self.labels[i].html(100 - valPercent).css((that.orientation === "horizontal" ? "left" : "bottom"), valPercent + "%");
                    }
                    lastValPercent = valPercent;
                });
            } else {
                value = this.value();
                valueMin = this._valueMin();
                valueMax = this._valueMax();
                valPercent = (valueMax !== valueMin) ?
					(value - valueMin) / (valueMax - valueMin) * 100 :
					0;
                _set[this.orientation === "horizontal" ? sliderHandleDirection : "bottom"] = valPercent + "%";
            
                this.handle.stop(1, 1)[animate ? "animate" : "css"](_set, o.animate);
                this.handle.attr("aria-valuemin", valueMin)
					.attr("aria-valuemax", valueMax)
					.attr("aria-valuenow", value)
					.attr("aria-valuetext", value)
					.attr("aria-labelledby", value);

                if (oRange === "min" && this.orientation === "horizontal") {
                    this.range.stop(1, 1)[animate ? "animate" : "css"]({
                        width: valPercent + "%"
                    }, o.animate);
                }
                if (oRange === "max" && this.orientation === "horizontal") {
                    this.range[animate ? "animate" : "css"]({
                        width: (100 - valPercent) + "%"
                    }, {
                        queue: false,
                        duration: o.animate
                    });
                }

                if (o.showSteps) {
                    for (i = 0 ; i < this.stepTicks.length; i++) {
                        var tick = this.stepTicks[i];
                        if (tick.perc >= valPercent) {
                            tick.addClass("afterHandle");
                        } else {
                            tick.removeClass("afterHandle");
                        }
                        if (i == this.stepTicks.length-1) {
	                        tick.addClass("last");
                        }
                    }
                }

                if (o.showValueLabel) {
                    var sliderDirection = Globalize.culture().isRTL ? 'right' : 'left';
                    self.labels[0].html(value).css((that.orientation === "horizontal" ? sliderDirection : "bottom"), valPercent + "%");
                }

                if (o.qualityScales) {
                    for (var index in o.qualityScales) {
                        if (value >= o.qualityScales[index].start && value <= o.qualityScales[index].end) {
                            this.range.attr("class", "inforSliderRange min inforColor " + index);
                        }
                    }
                }
                if (o.stepLabels) {
                    for (i = 0; i < o.stepLabels.length; i++) {
                        this.stepLabels[i].html(o.stepLabels[i]);
                        
                        if (o.showLabels) {
	                        this.stepLabels[i].css("margin-left", "-" + o.stepLabels[i].textWidth()/2 + "px");
                        } else {
	                         this.stepLabels[i].css("margin-left", "1px");
	                         if (i == o.stepLabels.length-1) {
		                     	this.stepLabels[i].css("margin-left", "-2px");    
	                         }
                        }
                    }
                }
            }
        }
    });
}(jQuery));