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
    channel: null,
    init: function (config) {
        if (config.length)
            this.setLength(config.length);
        if (config.tickFrequency)
            this.tickFrequency = config.tickFrequency;
        this.channel = new Channel();
        if (config.events)
            this.subscribe(config.events);
    },
    setLength: function (length) {
        this.length = length;
    },
    subscribe: function (events) {
        for (var type in events)
            this.channel.subscribe(
                new Subscription({
                    subscriber: (function (type, fn) {
                        return function (t) {
                            if (t != type)
                                return;
                            var args = [].slice.call(arguments, 1);
                            fn.apply(null, args);
                        };
                    })(type, events[type].bind(this))
                })
            );
    },
    start: function () {
        if (this.interval)
            this.clear();
        this.startDate = new Date();
        this.channel.publish("start");
        this.interval = setInterval(this.tick.bind(this), this.tickFrequency);
        this.tick();
    },
    tick: function () {
        this.elapsedTime = new Date() - this.startDate;
        if (this.elapsedTime > this.length)
            this.end();
        else
            this.channel.publish("tick", this.elapsedTime, this.length);
    },
    end: function () {
        this.clear();
        this.channel.publish("end");
    },
    clear: function () {
        clearInterval(this.interval);
        this.interval = null;
        delete(this.elapsedTime);
        this.channel.publish("clear");
    }
};