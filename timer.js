(function (Class) {

    window.Timer = Class.extend({
        interval: null,
        elapsedTime: null,
        startDate: null,
        length: null,
        tickFrequency: 100,
        init: function (config) {
            this.events = config.events;
        },
        changeLength: function (length) {
            this.length = length;
        },
        start: function () {
            if (this.interval)
                this.clear();
            this.startDate = new Date();
            if (this.events.started instanceof Function)
                this.events.started();
            this.interval = setInterval(this.tick.bind(this), this.tickFrequency);
            this.tick();
        },
        tick: function () {
            this.elapsedTime = new Date() - this.startDate;
            if (this.elapsedTime > this.length)
                this.end();
            else if (this.events.ticked instanceof Function)
                this.events.ticked(this.elapsedTime, this.length);
        },
        end: function () {
            this.clear();
            if (this.events.ended instanceof Function)
                this.events.ended();
        },
        clear: function () {
            clearInterval(this.interval);
            this.interval = null;
            delete(this.elapsedTime);
            if (this.events.cleared instanceof Function)
                this.events.cleared();
        }
    });

})(window.dflo.Class);