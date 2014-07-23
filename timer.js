var EventHub = function () {
    this.init.apply(this, arguments);
};
EventHub.prototype = {
    constructor: EventHub,
    events: null,
    init: function () {
        this.events = {};
        var args = Array.prototype.slice.call(arguments, 0);
        args.forEach(function (type) {
            this.register(type);
        }.bind(this));
    },
    register: function (type) {
        this.events[type] = [];
    },
    trigger: function (type) {
        var args = Array.prototype.slice.call(arguments, 1);
        this.events[type].forEach(function (listener) {
            listener.apply(this, args);
        }.bind(this));
    },
    on: function (type, listener) {
        this.events[type].push(listener);
    }
};


var Timer = function (config) {
    this.init(config);
};
Timer.prototype = {
    constructor: Timer,
    interval: null,
    elapsedTime: null,
    startDate: null,
    length: null,
    tickFrequency: 100,
    events: null,
    init: function (config) {
        if (!config.length)
            throw new Error();
        this.length = config.length;

        if (config.tickFrequency)
            this.tickFrequency = config.tickFrequency;

        this.events = new EventHub("start", "tick", "clear", "end");
        if (config.events)
            for (var type in config.events)
                this.events.on(type, config.events[type].bind(this));
    },
    start: function () {
        if (this.interval)
            this.clear();
        this.startDate = new Date();
        this.events.trigger("start");
        this.interval = setInterval(this.tick.bind(this), this.tickFrequency);
        this.tick();
    },
    tick: function () {
        this.elapsedTime = new Date() - this.startDate;
        if (this.elapsedTime > this.length)
            this.end();
        else
            this.events.trigger("tick", this.elapsedTime, this.length);
    },
    end: function () {
        this.clear();
        this.events.trigger("end");
    },
    clear: function () {
        clearInterval(this.interval);
        this.interval = null;
        delete(this.elapsedTime);
        this.events.trigger("clear");
    }
};