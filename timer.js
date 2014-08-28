(function (dflo) {

    var Class = dflo.Class;
    var Publisher = dflo.Publisher;
    var Subscriber = dflo.Subscriber;

    var Timer = Class.extend({
        interval: null,
        elapsedTime: null,
        startDate: null,
        started: undefined,
        ticked: undefined,
        ended: undefined,
        cleared: undefined,
        length: null,
        tickFrequency: 100,
        init: function (config) {
            this.started = new Publisher();
            this.ticked = new Publisher();
            this.ended = new Publisher();
            this.cleared = new Publisher();
            this.startInitiated = new Subscriber({
                callback: this.start,
                context: this
            });
            this.stopInitiated = new Subscriber({
                callback: this.clear,
                context: this
            });
            this.lengthSelected = new Subscriber({
                callback: this.setLength,
                context: this
            });
            if (!config)
                return;
            if (config.length)
                this.setLength(config.length);
            if (config.tickFrequency)
                this.tickFrequency = config.tickFrequency;
        },
        setLength: function (length) {
            this.length = length;
        },
        start: function () {
            if (this.interval)
                this.clear();
            this.startDate = new Date();
            this.started.publish();
            this.interval = setInterval(this.tick.bind(this), this.tickFrequency);
            this.tick();
        },
        tick: function () {
            this.elapsedTime = new Date() - this.startDate;
            if (this.elapsedTime > this.length)
                this.end();
            else
                this.ticked.publish(this.elapsedTime, this.length);
        },
        end: function () {
            this.clear();
            this.ended.publish();
        },
        clear: function () {
            clearInterval(this.interval);
            this.interval = null;
            delete(this.elapsedTime);
            this.cleared.publish();
        }
    });

    window.Timer = Timer;

})(window.dflo);