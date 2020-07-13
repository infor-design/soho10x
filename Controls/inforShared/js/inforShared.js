/*
* Collection of Plugins Shared across multiple plugins....
*/
(function($) {
/*
* $.timers - Timer abstractions for $
* Written by Blair Mitchelmore (blair DOT mitchelmore AT gmail DOT com)
* Licensed under the WTFPL (http://sam.zoy.org/wtfpl/).
* Date: 2009/10/16
*
* @author Blair Mitchelmore
* @version 1.2
*
**/
$.fn.extend({everyTime:function(a,b,c,d){return this.each(function(){$.timer.add(this,a,b,c,d)})},oneTime:function(a,b,c){return this.each(function(){$.timer.add(this,a,b,c,1)})},stopTime:function(a,b){return this.each(function(){$.timer.remove(this,a,b)})}});$.extend({timer:{global:[],guid:1,dataKey:"$.timer",regex:/^([0-9]+(?:\.[0-9]*)?)\s*(.*s)?$/,powers:{ms:1,cs:10,ds:100,s:1e3,das:1e4,hs:1e5,ks:1e6},timeParse:function(a){if(a==undefined||a==null)return null;var b=this.regex.exec($.trim(a.toString()));if(b[2]){var c=parseFloat(b[1]);var d=this.powers[b[2]]||1;return c*d}else{return a}},add:function(a,b,c,d,e){var f=0;if($.isFunction(c)){if(!e)e=d;d=c;c=b}b=$.timer.timeParse(b);if(typeof b!="number"||isNaN(b)||b<0)return;if(typeof e!="number"||isNaN(e)||e<0)e=0;e=e||0;var g=$.data(a,this.dataKey)||$.data(a,this.dataKey,{});if(!g[c])g[c]={};d.timerID=d.timerID||this.guid++;var h=function(){if(++f>e&&e!==0||d.call(a,f)===false)$.timer.remove(a,c,d)};h.timerID=d.timerID;if(!g[c][d.timerID])g[c][d.timerID]=window.setInterval(h,b);this.global.push(a)},remove:function(a,b,c){var d=$.data(a,this.dataKey),e;if(d){if(!b){for(b in d)this.remove(a,b,c)}else if(d[b]){if(c){if(c.timerID){window.clearInterval(d[b][c.timerID]);delete d[b][c.timerID]}}else{for(var c in d[b]){window.clearInterval(d[b][c]);delete d[b][c]}}for(e in d[b])break;if(!e){e=null;delete d[b]}}for(e in d)break;if(!e)$.removeData(a,this.dataKey)}}}});$(window).bind("unload",function(){$.each($.timer.global,function(a,b){$.timer.remove(b)})});

})($);


/*
* throttledresize: special jQuery event that happens at a reduced rate compared to "resize"
*
* latest version and complete README available on Github:
* https://github.com/louisremi/jquery-smartresize
*
* Copyright 2012 @louis_remi
* Licensed under the MIT license.
*
* This saved you an hour of work?
* Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
*/
(function($) {

var $event = $.event,
	$special,
	dummy = {_:0},
	frame = 0,
	wasResized, animRunning;

$special = $event.special.throttledresize = {
	setup: function() {
		$( this ).on( "resize", $special.handler );
	},
	teardown: function() {
		$( this ).off( "resize", $special.handler );
	},
	handler: function( event, execAsap ) {
		// Save the context
		var context = this,
			args = arguments;

		wasResized = true;

		if ( !animRunning ) {
			setInterval(function(){
				frame++;

				if ( frame > $special.threshold && wasResized || execAsap ) {
					// set correct event type
					event.type = "throttledresize";
					$event.dispatch.apply( context, args );
					wasResized = false;
					frame = 0;
				}
				if ( frame > 9 ) {
					$(dummy).stop();
					animRunning = false;
					frame = 0;
				}
			}, 30);
			animRunning = true;
		}
	},
	threshold: 0
};

})(jQuery);

/*
* $ Hotkeys Plugin
* Copyright 2010, John Resig
* Dual licensed under the MIT or GPL Version 2 licenses.
*
* Based upon the plugin by Tzury Bar Yochay:
* http://github.com/tzuryby/hotkeys
*
* Original idea by:
* Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
*/
(function($){

	$.hotkeys = {
		version: "0.8",

		specialKeys: {
			8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
			20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
			37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
			96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
			104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
			112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
			120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
		},

		shiftNums: {
			"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
			"8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
			".": ">",  "/": "?",  "\\": "|"
		}
	};

	function keyHandler( handleObj ) {
		// Only care when a possible input has been specified
		if ( typeof handleObj.data !== "string" ) {
			return;
		}

		var origHandler = handleObj.handler,
			keys = handleObj.data.toLowerCase().split(" ");

		handleObj.handler = function( event ) {
			// Don't fire in text-accepting inputs that we didn't directly bind to
			if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
				event.target.type === "text") ) {
				return;
			}

			// Keypress represents characters, not special keys
			var special = event.type !== "keypress" && $.hotkeys.specialKeys[ event.which ],
				character = String.fromCharCode( event.which ).toLowerCase(),
				modif = "", possible = {};

			// check combinations (alt|ctrl|shift+anything)
			if ( event.altKey && special !== "alt" ) {
				modif += "alt+";
			}

			if ( event.ctrlKey && special !== "ctrl" ) {
				modif += "ctrl+";
			}

			// TODO: Need to make sure this works consistently across platforms
			if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
				modif += "meta+";
			}

			if ( event.shiftKey && special !== "shift" ) {
				modif += "shift+";
			}

			if ( special ) {
				possible[ modif + special ] = true;

			} else {
				possible[ modif + character ] = true;
				possible[ modif + $.hotkeys.shiftNums[ character ] ] = true;

				// "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
				if ( modif === "shift+" ) {
					possible[ $.hotkeys.shiftNums[ character ] ] = true;
				}
			}

			for ( var i = 0, l = keys.length; i < l; i++ ) {
				if ( possible[ keys[i] ] ) {
					return origHandler.apply( this, arguments );
				}
			}
		};
	}

	$.each([ "keydown", "keyup", "keypress" ], function() {
		$.event.special[ this ] = { add: keyHandler };
	});

})( $ );


/*
* hoverIntent r6 // 2011.02.26 // $ 1.5.1+
* <http://cherne.net/brian/resources/$.hoverIntent.html>
*
* @param  f  onMouseOver function || An object with configuration options
* @param  g  onMouseOut function  || Nothing (use configuration options object)
* @author    Brian Cherne brian(at)cherne(dot)net
*/
(function($){$.fn.hoverIntent=function(f,g){var cfg={sensitivity:7,interval:100,timeout:0};cfg=$.extend(cfg,g?{over:f,out:g}:f);var cX,cY,pX,pY;var track=function(ev){cX=ev.pageX;cY=ev.pageY};var compare=function(ev,ob){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t);if((Math.abs(pX-cX)+Math.abs(pY-cY))<cfg.sensitivity){$(ob).unbind("mousemove",track);ob.hoverIntent_s=1;return cfg.over.apply(ob,[ev])}else{pX=cX;pY=cY;ob.hoverIntent_t=setTimeout(function(){compare(ev,ob)},cfg.interval)}};var delay=function(ev,ob){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t);ob.hoverIntent_s=0;return cfg.out.apply(ob,[ev])};var handleHover=function(e){var ev=$.extend({},e);var ob=this;if(ob.hoverIntent_t){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t)}if(e.type=="mouseenter"){pX=ev.pageX;pY=ev.pageY;$(ob).bind("mousemove",track);if(ob.hoverIntent_s!=1){ob.hoverIntent_t=setTimeout(function(){compare(ev,ob)},cfg.interval)}}else{$(ob).unbind("mousemove",track);if(ob.hoverIntent_s==1){ob.hoverIntent_t=setTimeout(function(){delay(ev,ob)},cfg.timeout)}}};return this.bind('mouseenter',handleHover).bind('mouseleave',handleHover)}})($);

/*
* Some Simple jQuery Functions
*/
(function($) {
	/*
	* Puts the cursor at the end of text in an input field.
	*/
	$.fn.putCursorAtEnd = function()
	{
		return this.each(function()
		{
			$(this).focus()

			// If this function exists...
			if (this.setSelectionRange)
			{
				// ... then use it
				// (Doesn't work in IE)

				// Double the length because Opera is inconsistent about whether a carriage return is one character or two. Sigh.
				var len = $(this).val().length * 2;
				this.setSelectionRange(len, len);
			}
			else
			{
				// ... otherwise replace the contents with itself
				// (Doesn't work in Google Chrome)
				$(this).val($(this).val());
			}

			// Scroll to the bottom, in case we're in a tall textarea
			// (Necessary for Firefox and Google Chrome)
			this.scrollTop = 999999;
		});
	};

	/*
	* Escape a String
	*/
	$.escape = function (str) {
		var entityMap = {
						"&": "&amp;",
						"<": "&lt;",
						">": "&gt;",
						'"': '&quot;',
						"'": '&#39;',
						"/": '&#x2F;'
					};

		return String(str).replace(/[&<>"'\/]/g, function (s) {
		return entityMap[s];
		});
	};

})($);

(function($) {
	/*
	* Cookie plugin
	*
	* Copyright (c) 2006 Klaus Hartl (stilbuero.de)
	* Dual licensed under the MIT and GPL licenses:
	* http://www.opensource.org/licenses/mit-license.php
	* http://www.gnu.org/licenses/gpl.html
	*
	*/
	$.cookie=function(name,value,options){if(typeof value!='undefined'){options=options||{};if(value===null){value='';options.expires=-1;}
	var expires='';if(options.expires&&(typeof options.expires=='number'||options.expires.toUTCString)){var date;if(typeof options.expires=='number'){date=new Date();date.setTime(date.getTime()+(options.expires*24*60*60*1000));}else{date=options.expires;}
	expires='; expires='+date.toUTCString();}
	var path=options.path?'; path='+options.path:'';var domain=options.domain?'; domain='+options.domain:'';var secure=options.secure?'; secure':'';document.cookie=[name,'=',encodeURIComponent(value),expires,path,domain,secure].join('');}else{var cookieValue=null;if(document.cookie&&document.cookie!=''){var cookies=document.cookie.split(';');for(var i=0;i<cookies.length;i++){var cookie=$.trim(cookies[i]);if(cookie.substring(0,name.length+1)==(name+'=')){cookieValue=decodeURIComponent(cookie.substring(name.length+1));break;}}}
	return cookieValue;}};

	/*
	* Local Storage Get and Setters...
	*/

	if (typeof(Storage)!=="undefined") {	// Non-IE8
		Storage.prototype.setObject = function(key, value) {
			this.setItem(key, JSON.stringify(value));
		}

		Storage.prototype.getObject = function(key) {
			var value = this.getItem(key);
			return value && JSON.parse(value);
		}
	}

	/*
	* Make an Iframe (or anything fx tabset) Fill from the top offset to bottom and handle the resize. Used in App nav for now.
	*/
	$.fn.fillToBottom = function () {
		return this.each(function ()
		{
			var $iFrame = $(this);
			//set the max height of this area to the bottom of the form and track any resize events...
			handleFrameResize($iFrame);
			$(window).on("throttledresize", function() {
				handleFrameResize($iFrame);
			});

			function handleFrameResize($frame) {
				var next = $frame.next(":visible").not(".inforFormButton"),
					maxHeight = $(window).height() - $frame.offset().top - next.height();	//the height of the nav

				$frame.css({ "border": "none" });
				if (next.hasClass("inforBottomFooter"))
					maxHeight -= 2;	//subtract 2 for the border

				$frame.height(maxHeight);
				$frame.width($(window).width());
			}
			$iFrame.show();
		});
	};
})(jQuery);

/* Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
* Licensed under the MIT License (LICENSE.txt).
*
* Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
* Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
* Thanks to: Seamus Leahy for adding deltaX and deltaY
*
* Version: 3.0.6
*
* Requires: 1.2.2+
*/
(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
	for ( var i=types.length; i; ) {
		$.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
	}
}

$.event.special.mousewheel = {
	setup: function() {
		if ( this.addEventListener ) {
			for ( var i=types.length; i; ) {
				this.addEventListener( types[--i], handler, false );
			}
		} else {
			this.onmousewheel = handler;
		}
	},

	teardown: function() {
		if ( this.removeEventListener ) {
			for ( var i=types.length; i; ) {
				this.removeEventListener( types[--i], handler, false );
			}
		} else {
			this.onmousewheel = null;
		}
	}
};

$.fn.extend({
	mousewheel: function(fn) {
		return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
	},

	unmousewheel: function(fn) {
		return this.unbind("mousewheel", fn);
	}
});


function handler(event) {
	var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, deltaX = 0, deltaY = 0;
	event = $.event.fix(orgEvent);
	event.type = "mousewheel";

	// Old school scrollwheel delta
	if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
	if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }

	// New school multidimensional scroll (touchpads) deltas
	deltaY = delta;

	// Gecko
	if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
		deltaY = 0;
		deltaX = -1*delta;
	}

	// Webkit
	if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
	if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }

	// Add event and delta to the front of the arguments
	args.unshift(event, delta, deltaX, deltaY);

	return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);

/*
* jquery.event.drag - v 2.2
* Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
* Open Source MIT License - http://threedubmedia.com/code/license
*/
(function( $ ){

// add the jquery instance method
$.fn.drag = function( str, arg, opts ){
	// figure out the event type
	var type = typeof str == "string" ? str : "",
	// figure out the event handler...
	fn = $.isFunction( str ) ? str : $.isFunction( arg ) ? arg : null;
	// fix the event type
	if ( type.indexOf("drag") !== 0 )
		type = "drag"+ type;
	// were options passed
	opts = ( str == fn ? arg : opts ) || {};
	// trigger or bind event handler
	return fn ? this.bind( type, opts, fn ) : this.trigger( type );
};

// local refs (increase compression)
var $event = $.event,
$special = $event.special,
// configure the drag special event
drag = $special.drag = {

	// these are the default settings
	defaults: {
		which: 1, // mouse button pressed to start drag sequence
		distance: 0, // distance dragged before dragstart
		not: ':input', // selector to suppress dragging on target elements
		handle: null, // selector to match handle target elements
		relative: false, // true to use "position", false to use "offset"
		drop: true, // false to suppress drop events, true or selector to allow
		click: false // false to suppress click events after dragend (no proxy)
	},

	// the key name for stored drag data
	datakey: "dragdata",

	// prevent bubbling for better performance
	noBubble: true,

	// count bound related events
	add: function( obj ){
		// read the interaction data
		var data = $.data( this, drag.datakey ),
		// read any passed options
		opts = obj.data || {};
		// count another realted event
		data.related += 1;
		// extend data options bound with this event
		// don't iterate "opts" in case it is a node
		$.each( drag.defaults, function( key, def ){
			if ( opts[ key ] !== undefined )
				data[ key ] = opts[ key ];
		});
	},

	// forget unbound related events
	remove: function(){
		$.data( this, drag.datakey ).related -= 1;
	},

	// configure interaction, capture settings
	setup: function(){
		// check for related events
		if ( $.data( this, drag.datakey ) )
			return;
		// initialize the drag data with copied defaults
		var data = $.extend({ related:0 }, drag.defaults );
		// store the interaction data
		$.data( this, drag.datakey, data );
		// bind the mousedown event, which starts drag interactions
		$event.add( this, "touchstart mousedown", drag.init, data );
		// prevent image dragging in IE...
		if ( this.attachEvent )
			this.attachEvent("ondragstart", drag.dontstart );
	},

	// destroy configured interaction
	teardown: function(){
		var data = $.data( this, drag.datakey ) || {};
		// check for related events
		if ( data.related )
			return;
		// remove the stored data
		$.removeData( this, drag.datakey );
		// remove the mousedown event
		$event.remove( this, "touchstart mousedown", drag.init );
		// enable text selection
		drag.textselect( true );
		// un-prevent image dragging in IE...
		if ( this.detachEvent )
			this.detachEvent("ondragstart", drag.dontstart );
	},

	// initialize the interaction
	init: function( event ){
		// sorry, only one touch at a time
		if ( drag.touched )
			return;
		// the drag/drop interaction data
		var dd = event.data, results;
		// check the which directive
		if ( event.which != 0 && dd.which > 0 && event.which != dd.which )
			return;
		// check for suppressed selector
		if ( $( event.target ).is( dd.not ) )
			return;
		// check for handle selector
		if ( dd.handle && !$( event.target ).closest( dd.handle, event.currentTarget ).length )
			return;

		drag.touched = event.type == 'touchstart' ? this : null;
		dd.propagates = 1;
		dd.mousedown = this;
		dd.interactions = [ drag.interaction( this, dd ) ];
		dd.target = event.target;
		dd.pageX = event.pageX;
		dd.pageY = event.pageY;
		dd.dragging = null;
		// handle draginit event...
		results = drag.hijack( event, "draginit", dd );
		// early cancel
		if ( !dd.propagates )
			return;
		// flatten the result set
		results = drag.flatten( results );
		// insert new interaction elements
		if ( results && results.length ){
			dd.interactions = [];
			$.each( results, function(){
				dd.interactions.push( drag.interaction( this, dd ) );
			});
		}
		// remember how many interactions are propagating
		dd.propagates = dd.interactions.length;
		// locate and init the drop targets
		if ( dd.drop !== false && $special.drop )
			$special.drop.handler( event, dd );
		// disable text selection
		drag.textselect( false );
		// bind additional events...
		if ( drag.touched )
			$event.add( drag.touched, "touchmove touchend", drag.handler, dd );
		else
			$event.add( document, "mousemove mouseup", drag.handler, dd );
		// helps prevent text selection or scrolling
		if ( !drag.touched || dd.live )
			return false;
	},

	// returns an interaction object
	interaction: function( elem, dd ){
		var offset = $( elem )[ dd.relative ? "position" : "offset" ]() || { top:0, left:0 };
		return {
			drag: elem,
			callback: new drag.callback(),
			droppable: [],
			offset: offset
		};
	},

	// handle drag-releatd DOM events
	handler: function( event ){
		// read the data before hijacking anything
		var dd = event.data;
		// handle various events
		switch ( event.type ){
			// mousemove, check distance, start dragging
			case !dd.dragging && 'touchmove':
				event.preventDefault();
			case !dd.dragging && 'mousemove':
				//  drag tolerance, x� + y� = distance�
				if ( Math.pow(  event.pageX-dd.pageX, 2 ) + Math.pow(  event.pageY-dd.pageY, 2 ) < Math.pow( dd.distance, 2 ) )
					break; // distance tolerance not reached
				event.target = dd.target; // force target from "mousedown" event (fix distance issue)
				drag.hijack( event, "dragstart", dd ); // trigger "dragstart"
				if ( dd.propagates ) // "dragstart" not rejected
					dd.dragging = true; // activate interaction
			// mousemove, dragging
			case 'touchmove':
				event.preventDefault();
			case 'mousemove':
				if ( dd.dragging ){
					// trigger "drag"
					drag.hijack( event, "drag", dd );
					if ( dd.propagates ){
						// manage drop events
						if ( dd.drop !== false && $special.drop )
							$special.drop.handler( event, dd ); // "dropstart", "dropend"
						break; // "drag" not rejected, stop
					}
					event.type = "mouseup"; // helps "drop" handler behave
				}
			// mouseup, stop dragging
			case 'touchend':
			case 'mouseup':
			default:
				if ( drag.touched )
					$event.remove( drag.touched, "touchmove touchend", drag.handler ); // remove touch events
				else
					$event.remove( document, "mousemove mouseup", drag.handler ); // remove page events
				if ( dd.dragging ){
					if ( dd.drop !== false && $special.drop )
						$special.drop.handler( event, dd ); // "drop"
					drag.hijack( event, "dragend", dd ); // trigger "dragend"
				}
				drag.textselect( true ); // enable text selection
				// if suppressing click events...
				if ( dd.click === false && dd.dragging )
					$.data( dd.mousedown, "suppress.click", new Date().getTime() + 5 );
				dd.dragging = drag.touched = false; // deactivate element
				break;
		}
	},

	// re-use event object for custom events
	hijack: function( event, type, dd, x, elem ){
		// not configured
		if ( !dd )
			return;
		// remember the original event and type
		var orig = { event:event.originalEvent, type:event.type },
		// is the event drag related or drog related?
		mode = type.indexOf("drop") ? "drag" : "drop",
		// iteration vars
		result, i = x || 0, ia, $elems, callback,
		len = !isNaN( x ) ? x : dd.interactions.length;
		// modify the event type
		event.type = type;
		// remove the original event
		event.originalEvent = null;
		// initialize the results
		dd.results = [];
		// handle each interacted element
		do if ( ia = dd.interactions[ i ] ){
			// validate the interaction
			if ( type !== "dragend" && ia.cancelled )
				continue;
			// set the dragdrop properties on the event object
			callback = drag.properties( event, dd, ia );
			// prepare for more results
			ia.results = [];
			// handle each element
			$( elem || ia[ mode ] || dd.droppable ).each(function( p, subject ){
				// identify drag or drop targets individually
				callback.target = subject;
				// force propagtion of the custom event
				event.isPropagationStopped = function(){ return false; };
				// handle the event
				result = subject ? $event.dispatch.call( subject, event, callback ) : null;
				// stop the drag interaction for this element
				if ( result === false ){
					if ( mode == "drag" ){
						ia.cancelled = true;
						dd.propagates -= 1;
					}
					if ( type == "drop" ){
						ia[ mode ][p] = null;
					}
				}
				// assign any dropinit elements
				else if ( type == "dropinit" )
					ia.droppable.push( drag.element( result ) || subject );
				// accept a returned proxy element
				if ( type == "dragstart" )
					ia.proxy = $( drag.element( result ) || ia.drag )[0];
				// remember this result
				ia.results.push( result );
				// forget the event result, for recycling
				delete event.result;
				// break on cancelled handler
				if ( type !== "dropinit" )
					return result;
			});
			// flatten the results
			dd.results[ i ] = drag.flatten( ia.results );
			// accept a set of valid drop targets
			if ( type == "dropinit" )
				ia.droppable = drag.flatten( ia.droppable );
			// locate drop targets
			if ( type == "dragstart" && !ia.cancelled )
				callback.update();
		}
		while ( ++i < len )
		// restore the original event & type
		event.type = orig.type;
		event.originalEvent = orig.event;
		// return all handler results
		return drag.flatten( dd.results );
	},

	// extend the callback object with drag/drop properties...
	properties: function( event, dd, ia ){
		var obj = ia.callback;
		// elements
		obj.drag = ia.drag;
		obj.proxy = ia.proxy || ia.drag;
		// starting mouse position
		obj.startX = dd.pageX;
		obj.startY = dd.pageY;
		// current distance dragged
		obj.deltaX = event.pageX - dd.pageX;
		obj.deltaY = event.pageY - dd.pageY;
		// original element position
		obj.originalX = ia.offset.left;
		obj.originalY = ia.offset.top;
		// adjusted element position
		obj.offsetX = obj.originalX + obj.deltaX;
		obj.offsetY = obj.originalY + obj.deltaY;
		// assign the drop targets information
		obj.drop = drag.flatten( ( ia.drop || [] ).slice() );
		obj.available = drag.flatten( ( ia.droppable || [] ).slice() );
		return obj;
	},

	// determine is the argument is an element or jquery instance
	element: function( arg ){
		if ( arg && ( arg.jquery || arg.nodeType == 1 ) )
			return arg;
	},

	// flatten nested jquery objects and arrays into a single dimension array
	flatten: function( arr ){
		return $.map( arr, function( member ){
			return member && member.jquery ? $.makeArray( member ) :
				member && member.length ? drag.flatten( member ) : member;
		});
	},

	// toggles text selection attributes ON (true) or OFF (false)
	textselect: function( bool ){
		$( document )[ bool ? "unbind" : "bind" ]("selectstart", drag.dontstart )
			.css("MozUserSelect", bool ? "" : "none" );
		// .attr("unselectable", bool ? "off" : "on" )
		document.unselectable = bool ? "off" : "on";
	},

	// suppress "selectstart" and "ondragstart" events
	dontstart: function(){
		return false;
	},

	// a callback instance contructor
	callback: function(){}

};

// callback methods
drag.callback.prototype = {
	update: function(){
		if ( $special.drop && this.available.length )
			$.each( this.available, function( i ){
				$special.drop.locate( this, i );
			});
	}
};

// event fix hooks for touch events...
var touchHooks =
$event.fixHooks.touchstart =
$event.fixHooks.touchmove =
$event.fixHooks.touchend =
$event.fixHooks.touchcancel = {
	props: "clientX clientY pageX pageY screenX screenY".split( " " ),
	filter: function( event, orig ) {
		if ( orig ){
			var touched = ( orig.touches && orig.touches[0] )
				|| ( orig.changedTouches && orig.changedTouches[0] )
				|| null;
			// iOS webkit: touchstart, touchmove, touchend
			if ( touched )
				$.each( touchHooks.props, function( i, prop ){
					event[ prop ] = touched[ prop ];
				});
		}
		return event;
	}
};

// share the same special event configuration with related events...
$special.draginit = $special.dragstart = $special.dragend = drag;

})( jQuery );

/*
* jquery.event.drop - v 2.2
* Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
* Open Source MIT License - http://threedubmedia.com/code/license
*/
(function($){ // secure $ jQuery alias

// Events: drop, dropstart, dropend
// add the jquery instance method
$.fn.drop = function( str, arg, opts ){
	// figure out the event type
	var type = typeof str == "string" ? str : "",
	// figure out the event handler...
	fn = $.isFunction( str ) ? str : $.isFunction( arg ) ? arg : null;
	// fix the event type
	if ( type.indexOf("drop") !== 0 )
		type = "drop"+ type;
	// were options passed
	opts = ( str == fn ? arg : opts ) || {};
	// trigger or bind event handler
	return fn ? this.bind( type, opts, fn ) : this.trigger( type );
};

// DROP MANAGEMENT UTILITY
// returns filtered drop target elements, caches their positions
$.drop = function( opts ){
	opts = opts || {};
	// safely set new options...
	drop.multi = opts.multi === true ? Infinity :
		opts.multi === false ? 1 : !isNaN( opts.multi ) ? opts.multi : drop.multi;
	drop.delay = opts.delay || drop.delay;
	drop.tolerance = $.isFunction( opts.tolerance ) ? opts.tolerance :
		opts.tolerance === null ? null : drop.tolerance;
	drop.mode = opts.mode || drop.mode || 'intersect';
};

// local refs (increase compression)
var $event = $.event,
$special = $event.special,
// configure the drop special event
drop = $.event.special.drop = {

	// these are the default settings
	multi: 1, // allow multiple drop winners per dragged element
	delay: 20, // async timeout delay
	mode: 'overlap', // drop tolerance mode

	// internal cache
	targets: [],

	// the key name for stored drop data
	datakey: "dropdata",

	// prevent bubbling for better performance
	noBubble: true,

	// count bound related events
	add: function( obj ){
		// read the interaction data
		var data = $.data( this, drop.datakey );
		// count another realted event
		data.related += 1;
	},

	// forget unbound related events
	remove: function(){
		$.data( this, drop.datakey ).related -= 1;
	},

	// configure the interactions
	setup: function(){
		// check for related events
		if ( $.data( this, drop.datakey ) )
			return;
		// initialize the drop element data
		var data = {
			related: 0,
			active: [],
			anyactive: 0,
			winner: 0,
			location: {}
		};
		// store the drop data on the element
		$.data( this, drop.datakey, data );
		// store the drop target in internal cache
		drop.targets.push( this );
	},

	// destroy the configure interaction
	teardown: function(){
		var data = $.data( this, drop.datakey ) || {};
		// check for related events
		if ( data.related )
			return;
		// remove the stored data
		$.removeData( this, drop.datakey );
		// reference the targeted element
		var element = this;
		// remove from the internal cache
		drop.targets = $.grep( drop.targets, function( target ){
			return ( target !== element );
		});
	},

	// shared event handler
	handler: function( event, dd ){
		// local vars
		var results, $targets;
		// make sure the right data is available
		if ( !dd )
			return;
		// handle various events
		switch ( event.type ){
			// draginit, from $.event.special.drag
			case 'mousedown': // DROPINIT >>
			case 'touchstart': // DROPINIT >>
				// collect and assign the drop targets
				$targets =  $( drop.targets );
				if ( typeof dd.drop == "string" )
					$targets = $targets.filter( dd.drop );
				// reset drop data winner properties
				$targets.each(function(){
					var data = $.data( this, drop.datakey );
					data.active = [];
					data.anyactive = 0;
					data.winner = 0;
				});
				// set available target elements
				dd.droppable = $targets;
				// activate drop targets for the initial element being dragged
				$special.drag.hijack( event, "dropinit", dd );
				break;
			// drag, from $.event.special.drag
			case 'mousemove': // TOLERATE >>
			case 'touchmove': // TOLERATE >>
				drop.event = event; // store the mousemove event
				if ( !drop.timer )
					// monitor drop targets
					drop.tolerate( dd );
				break;
			// dragend, from $.event.special.drag
			case 'mouseup': // DROP >> DROPEND >>
			case 'touchend': // DROP >> DROPEND >>
				drop.timer = clearTimeout( drop.timer ); // delete timer
				if ( dd.propagates ){
					$special.drag.hijack( event, "drop", dd );
					$special.drag.hijack( event, "dropend", dd );
				}
				break;

		}
	},

	// returns the location positions of an element
	locate: function( elem, index ){
		var data = $.data( elem, drop.datakey ),
		$elem = $( elem ),
		posi = $elem.offset() || {},
		height = $elem.outerHeight(),
		width = $elem.outerWidth(),
		location = {
			elem: elem,
			width: width,
			height: height,
			top: posi.top,
			left: posi.left,
			right: posi.left + width,
			bottom: posi.top + height
		};
		// drag elements might not have dropdata
		if ( data ){
			data.location = location;
			data.index = index;
			data.elem = elem;
		}
		return location;
	},

	// test the location positions of an element against another OR an X,Y coord
	contains: function( target, test ){ // target { location } contains test [x,y] or { location }
		return ( ( test[0] || test.left ) >= target.left && ( test[0] || test.right ) <= target.right
			&& ( test[1] || test.top ) >= target.top && ( test[1] || test.bottom ) <= target.bottom );
	},

	// stored tolerance modes
	modes: { // fn scope: "$.event.special.drop" object
		// target with mouse wins, else target with most overlap wins
		'intersect': function( event, proxy, target ){
			return this.contains( target, [ event.pageX, event.pageY ] ) ? // check cursor
				1e9 : this.modes.overlap.apply( this, arguments ); // check overlap
		},
		// target with most overlap wins
		'overlap': function( event, proxy, target ){
			// calculate the area of overlap...
			return Math.max( 0, Math.min( target.bottom, proxy.bottom ) - Math.max( target.top, proxy.top ) )
				* Math.max( 0, Math.min( target.right, proxy.right ) - Math.max( target.left, proxy.left ) );
		},
		// proxy is completely contained within target bounds
		'fit': function( event, proxy, target ){
			return this.contains( target, proxy ) ? 1 : 0;
		},
		// center of the proxy is contained within target bounds
		'middle': function( event, proxy, target ){
			return this.contains( target, [ proxy.left + proxy.width * .5, proxy.top + proxy.height * .5 ] ) ? 1 : 0;
		}
	},

	// sort drop target cache by by winner (dsc), then index (asc)
	sort: function( a, b ){
		return ( b.winner - a.winner ) || ( a.index - b.index );
	},

	// async, recursive tolerance execution
	tolerate: function( dd ){
		// declare local refs
		var i, drp, drg, data, arr, len, elem,
		// interaction iteration variables
		x = 0, ia, end = dd.interactions.length,
		// determine the mouse coords
		xy = [ drop.event.pageX, drop.event.pageY ],
		// custom or stored tolerance fn
		tolerance = drop.tolerance || drop.modes[ drop.mode ];
		// go through each passed interaction...
		do if ( ia = dd.interactions[x] ){
			// check valid interaction
			if ( !ia )
				return;
			// initialize or clear the drop data
			ia.drop = [];
			// holds the drop elements
			arr = [];
			len = ia.droppable.length;
			// determine the proxy location, if needed
			if ( tolerance )
				drg = drop.locate( ia.proxy );
			// reset the loop
			i = 0;
			// loop each stored drop target
			do if ( elem = ia.droppable[i] ){
				data = $.data( elem, drop.datakey );
				drp = data.location;
				if ( !drp ) continue;
				// find a winner: tolerance function is defined, call it
				data.winner = tolerance ? tolerance.call( drop, drop.event, drg, drp )
					// mouse position is always the fallback
					: drop.contains( drp, xy ) ? 1 : 0;
				arr.push( data );
			} while ( ++i < len ); // loop
			// sort the drop targets
			arr.sort( drop.sort );
			// reset the loop
			i = 0;
			// loop through all of the targets again
			do if ( data = arr[ i ] ){
				// winners...
				if ( data.winner && ia.drop.length < drop.multi ){
					// new winner... dropstart
					if ( !data.active[x] && !data.anyactive ){
						// check to make sure that this is not prevented
						if ( $special.drag.hijack( drop.event, "dropstart", dd, x, data.elem )[0] !== false ){
							data.active[x] = 1;
							data.anyactive += 1;
						}
						// if false, it is not a winner
						else
							data.winner = 0;
					}
					// if it is still a winner
					if ( data.winner )
						ia.drop.push( data.elem );
				}
				// losers...
				else if ( data.active[x] && data.anyactive == 1 ){
					// former winner... dropend
					$special.drag.hijack( drop.event, "dropend", dd, x, data.elem );
					data.active[x] = 0;
					data.anyactive -= 1;
				}
			} while ( ++i < len ); // loop
		} while ( ++x < end ) // loop
		// check if the mouse is still moving or is idle
		if ( drop.last && xy[0] == drop.last.pageX && xy[1] == drop.last.pageY )
			delete drop.timer; // idle, don't recurse
		else  // recurse
			drop.timer = setTimeout(function(){
				drop.tolerate( dd );
			}, drop.delay );
		// remember event, to compare idleness
		drop.last = drop.event;
	}

};

// share the same special event configuration with related events...
$special.dropinit = $special.dropstart = $special.dropend = drop;

})(jQuery); // confine scope


(function($){

	/* Return the Width of the text */
	String.prototype.textWidth = function(font) {
		var f = font || '12px Helvetica,?Arial,?sans-serif',
		o = $('<div>' + this + '</div>')
				.css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
				.appendTo($('body')),
		w = o.width();

		o.remove();
	return w;
	}

	if (navigator.appVersion.indexOf("MSIE 8.0") > -1) {
		$("html").addClass("ie8");
	}

	if (navigator.userAgent.indexOf("MSIE 8.0") > -1) {
		$("html").addClass("ie8");
	}

  if (document.documentMode === 8) {
    $("html").addClass("ie8");
  }

	if (navigator.appVersion.indexOf("MSIE 9.0") > -1) {
		$("html").addClass("ie9");
	}

}(jQuery));
