(function (dflo, gui) {

    var Class = dflo.Class;
    var uniqueId = dflo.uniqueId;
    var Subscriber = dflo.Subscriber;
    var Publisher = dflo.Publisher;

    var LengthSelect = Class.extend({
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
            this.changeLengthOut = new Publisher();
        },
        render: function () {
            this.el = $("<select>").attr({class: "length"});
            for (var length in this.lengthAlternatives)
                this.el.append($("<option>").append(
                    this.lengthAlternatives[length]).attr({value: length, selected: length == this.defaultLength})
                );
            this.el.change(function () {
                this.changeLengthOut.publish(this.el.val() * 1000);
            }.bind(this));
            this.changeLengthOut.publish(this.el.val() * 1000);
        }
    });

    var IntervalCheckbox = Class.extend({
        init: function (startOut) {
            this.startOut = startOut;
            this.ended = function () {
                if (this.el.prop("checked"))
                    startOut.publish();
            }.bind(this)
        },
        render: function () {
            this.el = $("<input>").attr({class: "interval", type: "checkbox", checked: "checked", id: "chk_id_" + uniqueId()});
            this.label = $("<label>").attr({for: this.el.attr("id")}).append("interval");
        }
    });

    var StopButton = Class.extend({
        init: function () {
            this.stopOut = new Publisher();
        },
        render: function () {
            this.el = $("<button>").attr({"class": "stop"}).append("stop");
            this.el.click(function () {
                this.stopOut.publish();
            }.bind(this));
        },
        started: function () {
            this.el.prop("disabled", false);
        },
        cleared: function () {
            this.el.prop("disabled", true);
        }
    });

    var StartButton = Class.extend({
        init: function () {
            this.startOut = new Publisher();
        },
        render: function () {
            this.el = $("<button>").attr({"class": "start"}).append("start");
            this.el.click(function () {
                this.startOut.publish();
            }.bind(this));
        },
        started: function () {
            this.el.prop("disabled", true);
        },
        cleared: function () {
            this.el.prop("disabled", false);
        }
    });


    var Display = Class.extend({
        init: function () {

        },
        render: function () {
            this.el = $("<section>").attr({class: "display"});
        },
        ticked: function (timeText) {
            this.el.text(timeText);
        },
        cleared: function () {
            this.el.text("-");
        }
    });

    var Title = Class.extend({
        init: function () {

        },
        ticked: function (timeText) {
            $(document).prop("title", "timer " + timeText);
        },
        cleared: function () {
            $(document).prop("title", "timer -");
        }
    });

    var BeepAudio = Class.extend({
        beepAudioSource: "vendor/beep-07.wav",
        init: function (){

        },
        render: function (){
            this.el = $("<audio>").attr({class: "beep", src: this.beepAudioSource});
        },
        ended: function (){
            var beep = this.el.get(0);
            beep.pause();
            beep.currentTime = 0;
            beep.play();
        }
    });

    var TimeToText = Class.extend({
        init: function (){

        },
        make: function (elapsedTime, length){
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
            return timeText;
        }
    });

    window.TimerView = Class.extend({
        init: function () {
            this.startedIn = new Subscriber({callback: this.started, context: this});
            this.tickedIn = new Subscriber({callback: this.ticked, context: this});
            this.clearedIn = new Subscriber({callback: this.cleared, context: this});
            this.endedIn = new Subscriber({callback: this.ended, context: this});

            this.beepAudio = new BeepAudio();

            this.title = new Title();
            this.display = new Display();

            this.startButton = new StartButton();
            this.startOut = this.startButton.startOut;

            this.stopButton = new StopButton();
            this.stopOut = this.stopButton.stopOut;

            this.intervalCheckbox = new IntervalCheckbox(this.startOut);

            this.lengthSelect = new LengthSelect();
            this.changeLengthOut = this.lengthSelect.changeLengthOut;
        },
        render: function () {
            this.startButton.render();
            this.stopButton.render();
            this.intervalCheckbox.render();
            this.lengthSelect.render();
            this.display.render();

            this.beepAudio.render();

            this.el = $("<section>").attr({class: "timer"}).append(
                $("<section>").attr({class: "config"}).append(this.lengthSelect.el, this.intervalCheckbox.el, this.intervalCheckbox.label),
                this.display.el,
                $("<section>").attr({class: "controllers"}).append(this.startButton.el, this.stopButton.el),
                $("<section>").attr({class: "sounds"}).append(this.beepAudio.el)
            );
            return this;
        },
        started: function () {
            this.startButton.started();
            this.stopButton.started();
        },
        ticked: function (elapsedTime, length) {
            var time2Text = new TimeToText();
            var timeText = time2Text.make(elapsedTime, length);
            this.display.ticked(timeText);
            this.title.ticked(timeText);
        },
        cleared: function () {
            this.startButton.cleared();
            this.stopButton.cleared();
            this.display.cleared();
            this.title.cleared();
        },
        ended: function () {
            this.beepAudio.ended();
            this.intervalCheckbox.ended();
        }
    });

})(window.dflo);