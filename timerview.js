(function (dflo, gui) {

    var Class = dflo.Class;
    var uniqueId = dflo.uniqueId;
    var Subscriber = dflo.Subscriber;
    var Publisher = dflo.Publisher;

    window.TimerView = Class.extend({
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
        beepAudioSource: "vendor/beep-07.wav",
        init: function () {
            this.startedIn = new Subscriber({callback: this.started, context: this});
            this.tickedIn = new Subscriber({callback: this.ticked, context: this});
            this.clearedIn = new Subscriber({callback: this.cleared, context: this});
            this.endedIn = new Subscriber({callback: this.ended, context: this});
            this.changeLengthOut = new Publisher();
            this.startOut = new Publisher();
            this.stopOut = new Publisher();
        },
        render: function () {
            this.lengthSelect = $("<select>").attr({class: "length"});
            for (var length in this.lengthAlternatives)
                this.lengthSelect.append($("<option>").append(
                    this.lengthAlternatives[length]).attr({value: length, selected: length == this.defaultLength})
                );
            this.lengthSelect.change(function () {
                this.changeLengthOut.publish(this.lengthSelect.val() * 1000);
            }.bind(this));
            this.changeLengthOut.publish(this.lengthSelect.val() * 1000);

            this.intervalCheckbox = $("<input>").attr({class: "interval", type: "checkbox", checked: "checked", id: "chk_id_" + uniqueId()});
            this.intervalCheckboxLabel = $("<label>").attr({for: this.intervalCheckbox.attr("id")}).append("interval");

            this.display = $("<section>").attr({class: "display"});

            this.startButton = $("<button>").attr({"class": "start"}).append("start");
            this.startButton.click(function () {
                this.startOut.publish();
            }.bind(this));

            this.stopButton = $("<button>").attr({"class": "stop"}).append("stop");
            this.stopButton.click(function () {
                this.stopOut.publish();
            }.bind(this));

            this.beepAudio = $("<audio>").attr({class: "beep", src: this.beepAudioSource});

            this.el = $("<section>").attr({class: "timer"}).append(
                $("<section>").attr({class: "config"}).append(this.lengthSelect, this.intervalCheckbox, this.intervalCheckboxLabel),
                this.display,
                $("<section>").attr({class: "controllers"}).append(this.startButton, this.stopButton),
                $("<section>").attr({class: "sounds"}).append(this.beepAudio)
            );
            return this;
        },
        started: function () {
            this.startButton.prop("disabled", true);
            this.stopButton.prop("disabled", false);
        },
        ticked: function (elapsedTime, length) {
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
            this.display.text(timeText);
            $(document).prop("title", "timer " + timeText);
        },
        cleared: function () {
            this.startButton.prop("disabled", false);
            this.stopButton.prop("disabled", true);
            this.display.text("-");
            $(document).prop("title", "timer -");
        },
        ended: function () {
            var beep = this.beepAudio.get(0);
            beep.pause();
            beep.currentTime = 0;
            beep.play();
            if (this.intervalCheckbox.prop("checked"))
                this.startOut.publish();
        }
    });

})(window.dflo, window.gui);