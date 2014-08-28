(function (dflo, gui) {

    var Class = dflo.Class;
    var Subscriber = dflo.Subscriber;
    var Publisher = dflo.Publisher;
    var Section = gui.Section;
    var Display = gui.Display;
    var SelectInput = gui.SelectInput;
    var CheckBox = gui.CheckBox;
    var Button = gui.Button;
    var Audio = gui.Audio;

    var TimerView = Class.extend({
        el: undefined,
        init: function () {
            this.started = new Subscriber({
                callback: function () {
                    this.startButton.disable();
                    this.stopButton.enable();
                },
                context: this
            });

            this.ticked = new Subscriber({
                callback: function (elapsedTime, length) {
                    var timeText = this.timeToText(length - elapsedTime);
                    this.display.text(timeText);
                    this.title.text("timer " + timeText);
                },
                context: this
            });

            this.cleared = new Subscriber({
                callback: function () {
                    this.startButton.enable();
                    this.stopButton.disable();
                    this.display.text("-");
                    this.title.text("timer -");
                },
                context: this
            });

            this.ended = new Subscriber({
                callback: function () {
                    this.beepAudio.replay();
                    if (this.intervalCheckbox.getValue())
                        this.startInitiated.publish();
                },
                context: this
            });

            this.lengthSelected = new Publisher();
            this.startInitiated = new Publisher();
            this.stopInitiated = new Publisher();
        },
        timeToText: function (time) {
            var text = "";
            var seconds = Math.floor(time / 1000) % 60;
            var minutes = Math.floor(time / 1000 / 60);
            if (minutes > 9)
                text += String(minutes);
            else
                text += "0" + String(minutes);
            text += ":";
            if (seconds > 9)
                text += String(seconds);
            else
                text += "0" + String(seconds);
            return text;
        },
        render: function () {

            this.lengthSelect = new SelectInput({
                class: "length",
                alternatives: {
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
                selected: 120
            });
            this.lengthSelect.changed.connect(new Subscriber({
                callback: function (value) {
                    this.lengthSelected.publish(value * 1000);
                },
                context: this
            }));
            this.lengthSelected.publish(this.lengthSelect.getValue() * 1000);

            this.intervalCheckbox = new CheckBox({
                class: "interval",
                title: "interval",
                selected: true
            });

            this.display = new Display({
                class: "display"
            });

            this.title = new (Class.extend({
                init: function () {
                    this.el = $(document);
                },
                text: function (value) {
                    this.el.prop("title", value);
                }
            }))();


            this.startButton = new Button({
                class: "start",
                title: "start"
            });
            this.startButton.clicked.connect(new Subscriber({
                callback: function () {
                    this.startInitiated.publish();
                },
                context: this
            }));

            this.stopButton = new Button({
                class: "stop",
                title: "stop"
            });
            this.stopButton.clicked.connect(new Subscriber({
                callback: function () {
                    this.stopInitiated.publish();
                },
                context: this
            }));

            this.beepAudio = new Audio({
                class: "beep",
                source: "vendor/beep-07.wav"
            });

            this.el = new Section({
                class: "timer",
                content: [
                    new Section({
                        class: "config",
                        content: [
                            this.lengthSelect,
                            this.intervalCheckbox
                        ]
                    }),
                    this.display,
                    new Section({
                        class: "controllers",
                        content: [
                            this.startButton,
                            this.stopButton
                        ]
                    }),
                    new Section({
                        class: "sounds",
                        content: [
                            this.beepAudio
                        ]
                    })
                ]

            }).el;

            return this;
        }
    });

    window.TimerView = TimerView;

})(window.dflo, window.gui);