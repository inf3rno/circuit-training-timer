(function (dflo, gui) {

    var Class = dflo.Class;
    var uniqueId = dflo.uniqueId;
    var Component = dflo.Component;
    var OutputPort = dflo.OutputPort;
    var InputPort = dflo.InputPort;
    var Message = dflo.Message;
    var Transformer = dflo.Transformer;

    var LengthSelect = Component.extend({
        lengthAlternatives: {
            3600: "1 hour",
            1800: "30 mins",
            900: "15 mins",
            600: "10 mins",
            300: "5 mins",
            120: "2 mins",
            90: "1.5 mins",
            60: "1 min",
            30: "30 secs",
            15: "15 secs",
            10: "10 secs",
            2: "2 secs"
        },
        defaultLength: 120,
        init: function () {
            Component.prototype.init.apply(this, arguments);
            this.ports = {
                selected: new OutputPort({
                    component: this
                })
            };
        },
        render: function () {
            this.el = $("<select>").attr({class: "length"});
            for (var length in this.lengthAlternatives)
                this.el.append($("<option>").append(
                    this.lengthAlternatives[length]).attr({value: length, selected: length == this.defaultLength})
                );
            var out = function () {
                this.ports.selected.relay(new Message(this.el.val() * 1000));
            }.bind(this);
            this.el.change(out);
            out();
        }
    });

    var IntervalCheckbox = Component.extend({
        init: function () {
            Component.prototype.init.apply(this, arguments);
            this.ports = {
                next: new OutputPort({
                    component: this
                }),
                ended: new InputPort({
                    component: this,
                    callback: function () {
                        if (this.el.prop("checked"))
                            this.ports.next.relay(new Message());
                    }.bind(this)
                })
            };
        },
        render: function () {
            this.el = $("<input>").attr({class: "interval", type: "checkbox", checked: "checked", id: "chk_id_" + uniqueId()});
            this.label = $("<label>").attr({for: this.el.attr("id")}).append("interval");
        }
    });

    var Button = Component.extend({
        init: function (config) {
            Component.prototype.init.apply(this, arguments);
            this.ports = {
                clicked: new OutputPort({
                    component: this
                }),
                enable: new InputPort({
                    component: this,
                    callback: function () {
                        this.el.prop("disabled", false);
                    }.bind(this)
                }),
                disable: new InputPort({
                    component: this,
                    callback: function () {
                        this.el.prop("disabled", true);
                    }.bind(this)
                })
            };
            this.label = config.label;
            this.class = config.class;
        },
        render: function () {
            this.el = $("<button>").attr({"class": this.class}).append(this.label);
            this.el.click(function () {
                this.ports.clicked.relay(new Message());
            }.bind(this));
        }
    });

    var Display = Component.extend({
        init: function () {
            Component.prototype.init.apply(this, arguments);
            this.ports = {
                text: new InputPort({
                    component: this,
                    callback: function (message) {
                        this.el.text(message.data[0]);
                    }.bind(this)
                }),
                clear: new InputPort({
                    component: this,
                    callback: function () {
                        this.el.text("-");
                    }.bind(this)
                })
            };
        },
        render: function () {
            this.el = $("<section>").attr({class: "display"});
        }
    });

    var Title = Component.extend({
        init: function () {
            Component.prototype.init.apply(this, arguments);
            this.ports = {
                text: new InputPort({
                    component: this,
                    callback: function (message) {
                        $(document).prop("title", "timer " + message.data[0]);
                    }
                }),
                clear: new InputPort({
                    component: this,
                    callback: function () {
                        $(document).prop("title", "timer -");
                    }
                })
            };
        }
    });

    var AudioFile = Component.extend({
        init: function (config) {
            Component.prototype.init.apply(this, arguments);
            this.ports = {
                replay: new InputPort({
                    component: this,
                    callback: function () {
                        var beep = this.el.get(0);
                        beep.pause();
                        beep.currentTime = 0;
                        beep.play();
                    }.bind(this)
                })
            };
            this.class = config.class;
            this.source = config.source;
        },
        render: function () {
            this.el = $("<audio>").attr({class: this.class, src: this.source});
        }
    });

    var Time2Text = Transformer.extend({
        init: function () {
            Transformer.prototype.init.call(this, {
                callback: function (data, done) {
                    var elapsedTime = data[0];
                    var length = data[1];
                    var remainingTime = length - elapsedTime;
                    var timeText = "";
                    var remainingSeconds = Math.floor(remainingTime / 1000) % 60;
                    var remainingMinutes = Math.floor(remainingTime / 1000 / 60);
                    if (remainingMinutes > 9)
                        timeText += String(remainingMinutes);
                    else
                        timeText += "0" + String(remainingMinutes);
                    timeText += ":";
                    if (remainingSeconds > 9)
                        timeText += String(remainingSeconds);
                    else
                        timeText += "0" + String(remainingSeconds);
                    done([timeText]);
                }
            });
        }
    });

    var SkeletonView = Class.extend({
        init: function () {

        },
        render: function () {
            this.el = $("<section>").attr({class: "timer"});
            this.config = $("<section>").attr({class: "config"});
            this.display = $("<section>");
            this.controllers = $("<section>").attr({class: "controllers"});
            this.sounds = $("<section>").attr({class: "sounds"});
            this.el.append(this.config, this.display, this.controllers, this.sounds);
            return this;
        }
    });

    window.view = {
        SkeletonView: SkeletonView,
        Button: Button,
        Title: Title,
        Display: Display,
        AudioFile: AudioFile,
        IntervalCheckbox: IntervalCheckbox,
        LengthSelect: LengthSelect,
        Time2Text: Time2Text
    };

})(window.dflo);