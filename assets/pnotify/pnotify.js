(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define('pnotify', ['jquery'], factory);
    } else {
        factory(jQuery);
    }
}(function($){
	var default_stack = {
		dir1: "down",
		dir2: "left",
		push: "top",
		spacing1: 15,
		spacing2: 15,
		context: $("body")
	};
	var timer, body,
		jwindow = $(window);
	var do_when_ready = function(){
		body = $("body");
		PNotify.prototype.options.stack.context = body;
		jwindow = $(window);
		jwindow.bind('resize', function(){
			if (timer)
				clearTimeout(timer);
			timer = setTimeout(function(){ PNotify.positionAll(true) }, 10);
		});
	};
	PNotify = function(options){
		this.parseOptions(options);
		this.init();
	};
	$.extend(PNotify.prototype, {
		version: "2.0.1",

		options: {
			title: false,
			title_escape: false,
			text: false,
			text_escape: false,
			styling: "bootstrap3",
			addclass: "",
			cornerclass: "",
			auto_display: true,
			width: "290px",
			min_height: "16px",
			type: "notice",
			icon: true,
			opacity: 1,
			animation: "fade",
			animate_speed: "slow",
			position_animate_speed: 500,
			shadow: false,
			hide: true,
			delay: 8000,
			mouse_reset: true,
			remove: true,
			insert_brs: true,
			destroy: true,
			stack: default_stack
		},

		modules: {},
		runModules: function(event, arg){
			var curArg;
			for (var module in this.modules) {
				curArg = ((typeof arg === "object" && module in arg) ? arg[module] : arg);
				if (typeof this.modules[module][event] === 'function')
					this.modules[module][event](this, typeof this.options[module] === 'object' ? this.options[module] : {}, curArg);
			}
		},

		state: "initializing", timer: null, styles: null,
		elem: null,
		container: null,
		title_container: null,
		text_container: null,
		animating: false, timerHide: false, init: function(){
			var that = this;

			this.modules = {};
			$.extend(true, this.modules, PNotify.prototype.modules);

			if (typeof this.options.styling === "object") {
				this.styles = this.options.styling;
			} else {
				this.styles = PNotify.styling[this.options.styling];
			}

			this.elem = $("<div />", {
				"class": "ui-pnotify "+this.options.addclass,
				"css": {"display": "none"},
				"mouseenter": function(e){
					if (that.options.mouse_reset && that.animating === "out") {
						if (!that.timerHide)
							return;
						that.cancelRemove();
					}
					if (that.options.hide && that.options.mouse_reset) that.cancelRemove();
				},
				"mouseleave": function(e){
					if (that.options.hide && that.options.mouse_reset) that.queueRemove();
					PNotify.positionAll();
				}
			});
			this.container = $("<div />", {"class":
				 this.styles.container+" ui-pnotify-container "+
				   (this.options.type === "error" ? this.styles.error :
				   (this.options.type === "primary" ? this.styles.primary :
				   (this.options.type === "info" ? this.styles.info :
				   (this.options.type === "success" ? this.styles.success :
				   (this.options.type === "warning" ? this.styles.warning :
				   (this.options.type === "danger" ? this.styles.danger :
				   (this.options.type === "alert" ? this.styles.alert :
				   (this.options.type === "system" ? this.styles.system :
				   (this.options.type === "dark" ? this.styles.dark :
				 	this.options.type === "success" ? this.styles.success : this.styles.notice)))))))))})
			
			.appendTo(this.elem);
			if (this.options.cornerclass !== "")
				this.container.removeClass("ui-corner-all").addClass(this.options.cornerclass);
			if (this.options.shadow)
				this.container.addClass("ui-pnotify-shadow");

			if (this.options.icon !== false) {
				$("<div />", {"class": "ui-pnotify-icon"})
				.append($("<span />", {"class": this.options.icon === true ? 
					(this.options.type === "error" ? this.styles.error_icon : 
					(this.options.type === "primary" ? this.styles.primary_icon : 
					(this.options.type === "info" ? this.styles.info_icon : 
					(this.options.type === "success" ? this.styles.success_icon : 
					(this.options.type === "warning" ? this.styles.warning_icon : 
					(this.options.type === "danger" ? this.styles.danger_icon : 
					(this.options.type === "alert" ? this.styles.alert_icon : 
					(this.options.type === "system" ? this.styles.system_icon : 
					(this.options.type === "dark" ? this.styles.dark_icon : this.styles.notice_icon))))))))) : this.options.icon}))
				.prependTo(this.container);
			}

			this.title_container = $("<h4 />", {
				"class": "ui-pnotify-title"
			})
			.appendTo(this.container);
			if (this.options.title === false)
				this.title_container.hide();
			else if (this.options.title_escape)
				this.title_container.text(this.options.title);
			else
				this.title_container.html(this.options.title);

			this.text_container = $("<div />", {
				"class": "ui-pnotify-text"
			})
			.appendTo(this.container);
			if (this.options.text === false)
				this.text_container.hide();
			else if (this.options.text_escape)
				this.text_container.text(this.options.text);
			else
				this.text_container.html(this.options.insert_brs ? String(this.options.text).replace(/\n/g, "<br />") : this.options.text);

			if (typeof this.options.width === "string")
				this.elem.css("width", this.options.width);
			if (typeof this.options.min_height === "string")
				this.container.css("min-height", this.options.min_height);


			if (this.options.stack.push === "top")
				PNotify.notices = $.merge([this], PNotify.notices);
			else
				PNotify.notices = $.merge(PNotify.notices, [this]);
			if (this.options.stack.push === "top")
				this.queuePosition(false, 1);

			this.options.stack.animation = false;

			this.runModules('init');

			if (this.options.auto_display)
				this.open();
			return this;
		},

		update: function(options){
			var oldOpts = this.options;
			this.parseOptions(oldOpts, options);
			if (this.options.cornerclass !== oldOpts.cornerclass)
				this.container.removeClass("ui-corner-all "+oldOpts.cornerclass).addClass(this.options.cornerclass);
			if (this.options.shadow !== oldOpts.shadow) {
				if (this.options.shadow)
					this.container.addClass("ui-pnotify-shadow");
				else
					this.container.removeClass("ui-pnotify-shadow");
			}
			if (this.options.addclass === false)
				this.elem.removeClass(oldOpts.addclass);
			else if (this.options.addclass !== oldOpts.addclass)
				this.elem.removeClass(oldOpts.addclass).addClass(this.options.addclass);
			if (this.options.title === false)
				this.title_container.slideUp("fast");
			else if (this.options.title !== oldOpts.title) {
				if (this.options.title_escape)
					this.title_container.text(this.options.title);
				else
					this.title_container.html(this.options.title);
				if (oldOpts.title === false)
					this.title_container.slideDown(200)
			}
			if (this.options.text === false) {
				this.text_container.slideUp("fast");
			} else if (this.options.text !== oldOpts.text) {
				if (this.options.text_escape)
					this.text_container.text(this.options.text);
				else
					this.text_container.html(this.options.insert_brs ? String(this.options.text).replace(/\n/g, "<br />") : this.options.text);
				if (oldOpts.text === false)
					this.text_container.slideDown(200)
			}
			if (this.options.type !== oldOpts.type)
				this.container.removeClass(
					this.styles.error+" "+this.styles.notice+" "+this.styles.primary+" "+this.styles.info+" "+this.styles.success+" "+this.styles.warning+" "+this.styles.danger+" "+this.styles.alert+" "+this.styles.system+" "+this.styles.dark
				).addClass(
					 this.options.type === "error" ? this.styles.error :
					 (this.options.type === "primary" ? this.styles.primary :
					 (this.options.type === "info" ? this.styles.info :
					 (this.options.type === "success" ? this.styles.success :
					 (this.options.type === "warning" ? this.styles.warning :
					 (this.options.type === "danger" ? this.styles.danger :
					 (this.options.type === "alert" ? this.styles.alert :
					 (this.options.type === "system" ? this.styles.system :
					 (this.options.type === "dark" ? this.styles.dark :
													 this.styles.notice
												 ) 
											 )
										 )
									 )
								 )
							 )
						 )
					 )										     	
				);
			if (this.options.icon !== oldOpts.icon || (this.options.icon === true && this.options.type !== oldOpts.type)) {
				this.container.find("div.ui-pnotify-icon").remove();
				if (this.options.icon !== false) {
					$("<div />", {"class": "ui-pnotify-icon"})
					.append($("<span />", {"class":
					 	 this.options.icon === true ?
						 (this.options.type === "error" ? this.styles.error_icon :
						 (this.options.type === "primary" ? this.styles.primary_icon :
						 (this.options.type === "info" ? this.styles.info_icon :
						 (this.options.type === "success" ? this.styles.success_icon :
						 (this.options.type === "warning" ? this.styles.warning_icon :
						 (this.options.type === "danger" ? this.styles.danger_icon :
						 (this.options.type === "alert" ? this.styles.alert_icon :
						 (this.options.type === "system" ? this.styles.system_icon :
						 (this.options.type === "dark" ? this.styles.dark_icon : this.styles.notice_icon))))))))) 
						 : this.options.icon}))
					.prependTo(this.container);
				}
			}
			if (this.options.width !== oldOpts.width)
				this.elem.animate({width: this.options.width});
			if (this.options.min_height !== oldOpts.min_height)
				this.container.animate({minHeight: this.options.min_height});
			if (this.options.opacity !== oldOpts.opacity)
				this.elem.fadeTo(this.options.animate_speed, this.options.opacity);
			if (!this.options.hide)
				this.cancelRemove();
			else if (!oldOpts.hide)
				this.queueRemove();
			this.queuePosition(true);

			this.runModules('update', oldOpts);
			return this;
		},

		open: function(){
			this.state = "opening";
			this.runModules('beforeOpen');

			var that = this;
			if (!this.elem.parent().length)
				this.elem.appendTo(this.options.stack.context ? this.options.stack.context : body);
			if (this.options.stack.push !== "top")
				this.position(true);
			if (this.options.animation === "fade" || this.options.animation.effect_in === "fade") {
				this.elem.show().fadeTo(0, 0).hide();
			} else {
				if (this.options.opacity !== 1)
					this.elem.show().fadeTo(0, this.options.opacity).hide();
			}
			this.animateIn(function(){
				that.queuePosition(true);

				if (that.options.hide)
					that.queueRemove();

				that.state = "open";

				that.runModules('afterOpen');
			});

			return this;
		},

		remove: function(timer_hide) {
			this.state = "closing";
			this.timerHide = !!timer_hide; this.runModules('beforeClose');

			var that = this;
			if (this.timer) {
				window.clearTimeout(this.timer);
				this.timer = null;
			}
			this.animateOut(function(){
				that.state = "closed";
				that.runModules('afterClose');
				that.queuePosition(true);
				if (that.options.remove)
					that.elem.detach();
				that.runModules('beforeDestroy');
				if (that.options.destroy) {
					if (PNotify.notices !== null) {
						var idx = $.inArray(that,PNotify.notices);
						if (idx !== -1) {
							PNotify.notices.splice(idx,1);
						}
					}
				}
				that.runModules('afterDestroy');
			});

			return this;
		},

		get: function(){ return this.elem; },

		parseOptions: function(options, moreOptions){
			this.options = $.extend(true, {}, PNotify.prototype.options);
			this.options.stack = PNotify.prototype.options.stack;
			var optArray = [options, moreOptions], curOpts;
			for (var curIndex in optArray) {
				curOpts = optArray[curIndex];
				if (typeof curOpts == "undefined")
					break;
				if (typeof curOpts !== 'object') {
					this.options.text = curOpts;
				} else {
					for (var option in curOpts) {
						if (this.modules[option]) {
							$.extend(true, this.options[option], curOpts[option]);
						} else {
							this.options[option] = curOpts[option];
						}
					}
				}
			}
		},

		animateIn: function(callback){
			this.animating = "in";
			var animation;
			if (typeof this.options.animation.effect_in !== "undefined")
				animation = this.options.animation.effect_in;
			else
				animation = this.options.animation;
			if (animation === "none") {
				this.elem.show();
				callback();
			} else if (animation === "show")
				this.elem.show(this.options.animate_speed, callback);
			else if (animation === "fade")
				this.elem.show().fadeTo(this.options.animate_speed, this.options.opacity, callback);
			else if (animation === "slide")
				this.elem.slideDown(this.options.animate_speed, callback);
			else if (typeof animation === "function")
				animation("in", callback, this.elem);
			else
				this.elem.show(animation, (typeof this.options.animation.options_in === "object" ? this.options.animation.options_in : {}), this.options.animate_speed, callback);
			if (this.elem.parent().hasClass('ui-effects-wrapper'))
				this.elem.parent().css({"position": "fixed", "overflow": "visible"});
			if (animation !== "slide")
				this.elem.css("overflow", "visible");
			this.container.css("overflow", "hidden");
		},

		animateOut: function(callback){
			this.animating = "out";
			var animation;
			if (typeof this.options.animation.effect_out !== "undefined")
				animation = this.options.animation.effect_out;
			else
				animation = this.options.animation;
			if (animation === "none") {
				this.elem.hide();
				callback();
			} else if (animation === "show")
				this.elem.hide(this.options.animate_speed, callback);
			else if (animation === "fade")
				this.elem.fadeOut(this.options.animate_speed, callback);
			else if (animation === "slide")
				this.elem.slideUp(this.options.animate_speed, callback);
			else if (typeof animation === "function")
				animation("out", callback, this.elem);
			else
				this.elem.hide(animation, (typeof this.options.animation.options_out === "object" ? this.options.animation.options_out : {}), this.options.animate_speed, callback);
			if (this.elem.parent().hasClass('ui-effects-wrapper'))
				this.elem.parent().css({"position": "fixed", "overflow": "visible"});
			if (animation !== "slide")
				this.elem.css("overflow", "visible");
			this.container.css("overflow", "hidden");
		},

		position: function(dontSkipHidden){
			var s = this.options.stack,
				e = this.elem;
			if (e.parent().hasClass('ui-effects-wrapper'))
				e = this.elem.css({"left": "0", "top": "0", "right": "0", "bottom": "0"}).parent();
			if (typeof s.context === "undefined")
				s.context = body;
			if (!s) return;
			if (typeof s.nextpos1 !== "number")
				s.nextpos1 = s.firstpos1;
			if (typeof s.nextpos2 !== "number")
				s.nextpos2 = s.firstpos2;
			if (typeof s.addpos2 !== "number")
				s.addpos2 = 0;
			var hidden = e.css("display") === "none";
			if (!hidden || dontSkipHidden) {
				var curpos1, curpos2;
				var animate = {};
				var csspos1;
				switch (s.dir1) {
					case "down":
						csspos1 = "top";
						break;
					case "up":
						csspos1 = "bottom";
						break;
					case "left":
						csspos1 = "right";
						break;
					case "right":
						csspos1 = "left";
						break;
				}
				curpos1 = parseInt(e.css(csspos1).replace(/(?:\..*|[^0-9.])/g, ''));
				if (isNaN(curpos1))
					curpos1 = 0;
				if (typeof s.firstpos1 === "undefined" && !hidden) {
					s.firstpos1 = curpos1;
					s.nextpos1 = s.firstpos1;
				}
				var csspos2;
				switch (s.dir2) {
					case "down":
						csspos2 = "top";
						break;
					case "up":
						csspos2 = "bottom";
						break;
					case "left":
						csspos2 = "right";
						break;
					case "right":
						csspos2 = "left";
						break;
				}
				curpos2 = parseInt(e.css(csspos2).replace(/(?:\..*|[^0-9.])/g, ''));
				if (isNaN(curpos2))
					curpos2 = 0;
				if (typeof s.firstpos2 === "undefined" && !hidden) {
					s.firstpos2 = curpos2;
					s.nextpos2 = s.firstpos2;
				}
				if ((s.dir1 === "down" && s.nextpos1 + e.height() > (s.context.is(body) ? jwindow.height() : s.context.prop('scrollHeight')) ) ||
					(s.dir1 === "up" && s.nextpos1 + e.height() > (s.context.is(body) ? jwindow.height() : s.context.prop('scrollHeight')) ) ||
					(s.dir1 === "left" && s.nextpos1 + e.width() > (s.context.is(body) ? jwindow.width() : s.context.prop('scrollWidth')) ) ||
					(s.dir1 === "right" && s.nextpos1 + e.width() > (s.context.is(body) ? jwindow.width() : s.context.prop('scrollWidth')) ) ) {
					s.nextpos1 = s.firstpos1;
					s.nextpos2 += s.addpos2 + (typeof s.spacing2 === "undefined" ? 25 : s.spacing2);
					s.addpos2 = 0;
				}
				if (s.animation && s.nextpos2 < curpos2) {
					switch (s.dir2) {
						case "down":
							animate.top = s.nextpos2+"px";
							break;
						case "up":
							animate.bottom = s.nextpos2+"px";
							break;
						case "left":
							animate.right = s.nextpos2+"px";
							break;
						case "right":
							animate.left = s.nextpos2+"px";
							break;
					}
				} else {
					if(typeof s.nextpos2 === "number")
						e.css(csspos2, s.nextpos2+"px");
				}
				switch (s.dir2) {
					case "down":
					case "up":
						if (e.outerHeight(true) > s.addpos2)
							s.addpos2 = e.height();
						break;
					case "left":
					case "right":
						if (e.outerWidth(true) > s.addpos2)
							s.addpos2 = e.width();
						break;
				}
				if (typeof s.nextpos1 === "number") {
					if (s.animation && (curpos1 > s.nextpos1 || animate.top || animate.bottom || animate.right || animate.left)) {
						switch (s.dir1) {
							case "down":
								animate.top = s.nextpos1+"px";
								break;
							case "up":
								animate.bottom = s.nextpos1+"px";
								break;
							case "left":
								animate.right = s.nextpos1+"px";
								break;
							case "right":
								animate.left = s.nextpos1+"px";
								break;
						}
					} else
						e.css(csspos1, s.nextpos1+"px");
				}
				if (animate.top || animate.bottom || animate.right || animate.left)
					e.animate(animate, {duration: this.options.position_animate_speed, queue: false});
				switch (s.dir1) {
					case "down":
					case "up":
						s.nextpos1 += e.height() + (typeof s.spacing1 === "undefined" ? 25 : s.spacing1);
						break;
					case "left":
					case "right":
						s.nextpos1 += e.width() + (typeof s.spacing1 === "undefined" ? 25 : s.spacing1);
						break;
				}
			}
			return this;
		},
		queuePosition: function(animate, milliseconds){
			if (timer)
				clearTimeout(timer);
			if (!milliseconds)
				milliseconds = 10;
			timer = setTimeout(function(){ PNotify.positionAll(animate) }, milliseconds);
			return this;
		},


		cancelRemove: function(){
			if (this.timer)
				window.clearTimeout(this.timer);
			if (this.state === "closing") {
				this.elem.stop(true);
				this.state = "open";
				this.animating = "in";
				this.elem.css("height", "auto").animate({"width": this.options.width, "opacity": this.options.opacity}, "fast");
			}
			return this;
		},
		queueRemove: function(){
			var that = this;
			this.cancelRemove();
			this.timer = window.setTimeout(function(){
				that.remove(true);
			}, (isNaN(this.options.delay) ? 0 : this.options.delay));
			return this;
		}
	});
	$.extend(PNotify, {
		notices: [],
		removeAll: function () {
			$.each(PNotify.notices, function(){
				if (this.remove)
					this.remove();
			});
		},
		positionAll: function (animate) {
			if (timer)
				clearTimeout(timer);
			timer = null;
			$.each(PNotify.notices, function(){
				var s = this.options.stack;
				if (!s) return;
				s.nextpos1 = s.firstpos1;
				s.nextpos2 = s.firstpos2;
				s.addpos2 = 0;
				s.animation = animate;
			});
			$.each(PNotify.notices, function(){
				this.position();
			});
		},
		styling: {
			jqueryui: {
				container: "ui-widget ui-widget-content ui-corner-all",
				notice: "ui-state-highlight",
				notice_icon: "ui-icon ui-icon-info",
				info: "",
				info_icon: "ui-icon ui-icon-info",
				success: "ui-state-default",
				success_icon: "ui-icon ui-icon-circle-check",
				error: "ui-state-error",
				error_icon: "ui-icon ui-icon-alert"
			},
			bootstrap2: {
				container: "alert",
				notice: "",
				notice_icon: "icon-exclamation-sign",
				info: "alert-info",
				info_icon: "icon-info-sign",
				success: "alert-success",
				success_icon: "icon-ok-sign",
				error: "alert-error",
				error_icon: "icon-warning-sign"
			},
			bootstrap3: {
				container: "alert",
				notice: "alert-default",
				notice_icon: "glyphicon glyphicon-exclamation-sign",
				error: "alert-danger",
				error_icon: "glyphicon glyphicon-warning-sign",
				primary: "alert-primary",
				primary_icon: "glyphicon glyphicon-exclamation-sign",
				info: "alert-info",
				info_icon: "glyphicon glyphicon-info-sign",
				success: "alert-success",
				success_icon: "glyphicon glyphicon-ok-sign",
				warning: "alert-warning",
				warning_icon: "glyphicon glyphicon-ok-sign",
				danger: "alert-danger",
				danger_icon: "glyphicon glyphicon-warning-sign",
				alert: "alert-alert",
				alert_icon: "glyphicon glyphicon-warning-sign",
				system: "alert-system",
				system_icon: "glyphicon glyphicon-warning-sign",
				dark: "alert-dark",
				dark_icon: "glyphicon glyphicon-warning-sign",
			}
		}
	});
	/*
	 * uses icons from http:* version 4.0.3
	 */
	PNotify.styling.fontawesome = $.extend({}, PNotify.styling.bootstrap3);
	$.extend(PNotify.styling.fontawesome, {
		notice_icon: "fa fa-exclamation-circle",
		error_icon: "fa fa-warning",
		primary_icon: "fa fa-info",
		info_icon: "fa fa-info",
		success_icon: "fa fa-check",
		warning_icon: "fa fa-check",
		danger_icon: "fa fa-info",
		alert_icon: "fa fa-check",
		system_icon: "fa fa-warning",
		dark_icon: "fa fa-warning",
	});

	if (document.body)
		do_when_ready();
	else
		$(do_when_ready);
	return PNotify;
}));
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define('pnotify.buttons', ['jquery', 'pnotify'], factory);
    } else {
        factory(jQuery, PNotify);
    }
}(function($, PNotify){
	PNotify.prototype.options.buttons = {
		closer: true,
		closer_hover: true,
		sticker: true,
		sticker_hover: true,
		labels: {
			close: "Close",
			stick: "Stick"
		}
	};
	PNotify.prototype.modules.buttons = {
		myOptions: null,

		closer: null,
		sticker: null,

		init: function(notice, options){
			var that = this;
			this.myOptions = options;
			notice.elem.on({
				"mouseenter": function(e){
					if (that.myOptions.sticker && !(notice.options.nonblock && notice.options.nonblock.nonblock)) that.sticker.trigger("pnotify_icon").css("visibility", "visible");
					if (that.myOptions.closer && !(notice.options.nonblock && notice.options.nonblock.nonblock)) that.closer.css("visibility", "visible");
				},
				"mouseleave": function(e){
					if (that.myOptions.sticker_hover)
						that.sticker.css("visibility", "hidden");
					if (that.myOptions.closer_hover)
						that.closer.css("visibility", "hidden");
				}
			});

			this.sticker = $("<div />", {
				"class": "ui-pnotify-sticker",
				"css": {"cursor": "pointer", "visibility": options.sticker_hover ? "hidden" : "visible"},
				"click": function(){
					notice.options.hide = !notice.options.hide;
					if (notice.options.hide)
						notice.queueRemove();
					else
						notice.cancelRemove();
					$(this).trigger("pnotify_icon");
				}
			})
			.bind("pnotify_icon", function(){
				$(this).children().removeClass(notice.styles.pin_up+" "+notice.styles.pin_down).addClass(notice.options.hide ? notice.styles.pin_up : notice.styles.pin_down);
			})
			.append($("<span />", {"class": notice.styles.pin_up, "title": options.labels.stick}))
			.prependTo(notice.container);
			if (!options.sticker || (notice.options.nonblock && notice.options.nonblock.nonblock))
				this.sticker.css("display", "none");

			this.closer = $("<div />", {
				"class": "ui-pnotify-closer",
				"css": {"cursor": "pointer", "visibility": options.closer_hover ? "hidden" : "visible"},
				"click": function(){
					notice.remove(false);
					that.sticker.css("visibility", "hidden");
					that.closer.css("visibility", "hidden");
				}
			})
			.append($("<span />", {"class": notice.styles.closer, "title": options.labels.close}))
			.prependTo(notice.container);
			if (!options.closer || (notice.options.nonblock && notice.options.nonblock.nonblock))
				this.closer.css("display", "none");
		},
		update: function(notice, options){
			this.myOptions = options;
			if (!options.closer || (notice.options.nonblock && notice.options.nonblock.nonblock))
				this.closer.css("display", "none");
			else if (options.closer)
				this.closer.css("display", "block");
			if (!options.sticker || (notice.options.nonblock && notice.options.nonblock.nonblock))
				this.sticker.css("display", "none");
			else if (options.sticker)
				this.sticker.css("display", "block");
			this.sticker.trigger("pnotify_icon");
			if (options.sticker_hover)
				this.sticker.css("visibility", "hidden");
			else if (!(notice.options.nonblock && notice.options.nonblock.nonblock))
				this.sticker.css("visibility", "visible");
			if (options.closer_hover)
				this.closer.css("visibility", "hidden");
			else if (!(notice.options.nonblock && notice.options.nonblock.nonblock))
				this.closer.css("visibility", "visible");
		}
	};
	$.extend(PNotify.styling.jqueryui, {
		closer: "ui-icon ui-icon-close",
		pin_up: "ui-icon ui-icon-pin-w",
		pin_down: "ui-icon ui-icon-pin-s"
	});
	$.extend(PNotify.styling.bootstrap2, {
		closer: "icon-remove",
		pin_up: "icon-pause",
		pin_down: "icon-play"
	});
	$.extend(PNotify.styling.bootstrap3, {
		closer: "glyphicon glyphicon-remove",
		pin_up: "glyphicon glyphicon-pause",
		pin_down: "glyphicon glyphicon-play"
	});
	$.extend(PNotify.styling.fontawesome, {
		closer: "fa fa-times",
		pin_up: "fa fa-pause",
		pin_down: "fa fa-play"
	});
}));
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define('pnotify.confirm', ['jquery', 'pnotify'], factory);
    } else {
        factory(jQuery, PNotify);
    }
}(function($, PNotify){
	PNotify.prototype.options.confirm = {
		confirm: false,
		prompt: false,
		prompt_class: "",
		prompt_default: "",
		prompt_multi_line: false,
		align: "right",
		buttons: [
			{
				text: "Ok",
				addClass: "",
				promptTrigger: true,
				click: function(notice, value){
					notice.remove();
					notice.get().trigger("pnotify.confirm", [notice, value]);
				}
			},
			{
				text: "Cancel",
				addClass: "",
				click: function(notice){
					notice.remove();
					notice.get().trigger("pnotify.cancel", notice);
				}
			}
		]
	};
	PNotify.prototype.modules.confirm = {
		container: null,
		prompt: null,

		init: function(notice, options){
			this.container = $('<div style="margin-top:5px;clear:both;" />').css('text-align', options.align).appendTo(notice.container);

			if (options.confirm || options.prompt)
				this.makeDialog(notice, options);
			else
				this.container.hide();
		},

		update: function(notice, options){
			if (options.confirm) {
				this.makeDialog(notice, options);
				this.container.show();
			} else {
				this.container.hide().empty();
			}
		},

		afterOpen: function(notice, options){
			if (options.prompt)
				this.prompt.focus();
		},

		makeDialog: function(notice, options) {
			var already = false, that = this, btn, elem;
			this.container.empty();
			if (options.prompt) {
				this.prompt = $('<'+(options.prompt_multi_line ? 'textarea rows="5"' : 'input type="text"')+' style="margin-bottom:5px;clear:both;" />')
				.addClass(notice.styles.input+' '+options.prompt_class)
				.val(options.prompt_default)
				.appendTo(this.container);
			}
			for (var i in options.buttons) {
				btn = options.buttons[i];
				if (already)
					this.container.append(' ');
				else
					already = true;
				elem = $('<button type="button" />')
				.addClass(notice.styles.btn+' '+btn.addClass)
				.text(btn.text)
				.appendTo(this.container)
				.on("click", (function(btn){ return function(){
					if (typeof btn.click == "function") {
						btn.click(notice, options.prompt ? that.prompt.val() : null);
					}
				}})(btn));
				if (options.prompt && !options.prompt_multi_line && btn.promptTrigger)
					this.prompt.keypress((function(elem){ return function(e){
						if (e.keyCode == 13)
							elem.click();
					}})(elem));
				if (notice.styles.text) {
					elem.wrapInner('<span class="'+notice.styles.text+'"></span>');
				}
				if (notice.styles.btnhover) {
					elem.hover((function(elem){ return function(){
						elem.addClass(notice.styles.btnhover);
					}})(elem), (function(elem){ return function(){
						elem.removeClass(notice.styles.btnhover);
					}})(elem));
				}
				if (notice.styles.btnactive) {
					elem.on("mousedown", (function(elem){ return function(){
						elem.addClass(notice.styles.btnactive);
					}})(elem)).on("mouseup", (function(elem){ return function(){
						elem.removeClass(notice.styles.btnactive);
					}})(elem));
				}
				if (notice.styles.btnfocus) {
					elem.on("focus", (function(elem){ return function(){
						elem.addClass(notice.styles.btnfocus);
					}})(elem)).on("blur", (function(elem){ return function(){
						elem.removeClass(notice.styles.btnfocus);
					}})(elem));
				}
			}
		}
	};
	$.extend(PNotify.styling.jqueryui, {
		btn: "ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only",
		btnhover: "ui-state-hover",
		btnactive: "ui-state-active",
		btnfocus: "ui-state-focus",
		input: "",
		text: "ui-button-text"
	});
	$.extend(PNotify.styling.bootstrap2, {
		btn: "btn",
		input: ""
	});
	$.extend(PNotify.styling.bootstrap3, {
		btn: "btn btn-default",
		input: "form-control"
	});
	$.extend(PNotify.styling.fontawesome, {
		btn: "btn btn-default",
		input: "form-control"
	});
}));
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define('pnotify.desktop', ['jquery', 'pnotify'], factory);
    } else {
        factory(jQuery, PNotify);
    }
}(function($, PNotify){
	var permission;
	var notify = function(title, options){
		if ("Notification" in window) {
			notify = function (title, options) {
				return new Notification(title, options);
			};
		} else if ("mozNotification" in navigator) {
			notify = function (title, options) {
				return navigator.mozNotification
					.createNotification(title, options.body, options.icon)
					.show();
			};
		} else if ("webkitNotifications" in window) {
			notify = function (title, options) {
				return window.webkitNotifications.createNotification(
					options.icon,
					title,
					options.body
				);
			};
		} else {
			notify = function (title, options) {
				return null;
			};
		}
		return notify(title, options);
	};


	PNotify.prototype.options.desktop = {
		desktop: false,
		icon: null,
		tag: null
	};
	PNotify.prototype.modules.desktop = {
		tag: null,
		icon: null,
		genNotice: function(notice, options){
			if (options.icon === null) {
				this.icon = "http://sciactive.com/pnotify/includes/desktop/"+notice.options.type+".png";
			} else if (options.icon === false) {
				this.icon = null;
			} else {
				this.icon = options.icon;
			}
			if (this.tag === null || options.tag !== null) {
				this.tag = options.tag === null ? "PNotify-"+Math.round(Math.random() * 1000000) : options.tag;
			}
			notice.desktop = notify(notice.options.title, {
				icon: this.icon,
				body: notice.options.text,
				tag: this.tag
			});
			if (!("close" in notice.desktop)) {
				notice.desktop.close = function(){
					notice.desktop.cancel();
				};
			}
			notice.desktop.onclick = function(){
				notice.elem.trigger("click");
			};
			notice.desktop.onclose = function(){
				if (notice.state !== "closing" && notice.state !== "closed") {
					notice.remove();
				}
			};
		},
		init: function(notice, options){
			if (!options.desktop)
				return;
			permission = PNotify.desktop.checkPermission();
			if (permission != 0)
				return;
			this.genNotice(notice, options);
		},
		update: function(notice, options, oldOpts){
			if (permission != 0 || !options.desktop)
				return;
			this.genNotice(notice, options);
		},
		beforeOpen: function(notice, options){
			if (permission != 0 || !options.desktop)
				return;
			notice.elem.css({'left': '-10000px', 'display': 'none'});
		},
		afterOpen: function(notice, options){
			if (permission != 0 || !options.desktop)
				return;
			notice.elem.css({'left': '-10000px', 'display': 'none'});
			if ("show" in notice.desktop) {
				notice.desktop.show();
			}
		},
		beforeClose: function(notice, options){
			if (permission != 0 || !options.desktop)
				return;
			notice.elem.css({'left': '-10000px', 'display': 'none'});
		},
		afterClose: function(notice, options){
			if (permission != 0 || !options.desktop)
				return;
			notice.elem.css({'left': '-10000px', 'display': 'none'});
			notice.desktop.close();
		}
	};
	PNotify.desktop = {
		permission: function(){
			if (typeof Notification !== "undefined" && "requestPermission" in Notification) {
				Notification.requestPermission();
			} else if ("webkitNotifications" in window) {
				window.webkitNotifications.requestPermission();
			}
		},
		checkPermission: function(){
			if (typeof Notification !== "undefined" && "permission" in Notification) {
				return (Notification.permission == "granted" ? 0 : 1);
			} else if ("webkitNotifications" in window) {
				return window.webkitNotifications.checkPermission();
			} else {
				return 1;
			}
		}
	};
	permission = PNotify.desktop.checkPermission();
}));
