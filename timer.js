(function (dflo) {

    var Class = dflo.Class;
    var Publisher = dflo.Publisher;
    var Subscriber = dflo.Subscriber;

    window.Timer = Class.extend({
        interval: null,
        elapsedTime: null,
        startDate: null,
        length: null,
        tickFrequency: 100,
        init: function (config) {
            this.startedOut = new Publisher();
            this.tickedOut = new Publisher();
            this.endedOut = new Publisher();
            this.clearedOut = new Publisher();
            this.startIn = new Subscriber({callback: this.start, context: this});
            this.stopIn = new Subscriber({callback: this.clear, context: this});
            this.changeLengthIn = new Subscriber({callback: this.changeLength, context: this});
        },
        changeLength: function (length) {
            this.length = length;
        },
        start: function () {
            if (this.interval)
                this.clear();
            this.startDate = new Date();
            this.startedOut.publish();
            this.interval = setInterval(this.tick.bind(this), this.tickFrequency);
            this.tick();
        },
        tick: function () {
            this.elapsedTime = new Date() - this.startDate;
            if (this.elapsedTime > this.length)
                this.end();
            else
                this.tickedOut.publish(this.elapsedTime, this.length);
        },
        end: function () {
            this.clear();
            this.endedOut.publish();
        },
        clear: function () {
            clearInterval(this.interval);
            this.interval = null;
            delete(this.elapsedTime);
            this.clearedOut.publish();
        }
    });

})(window.dflo);