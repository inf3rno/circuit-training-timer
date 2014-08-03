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
        if (config.length)
            this.setLength(config.length);

        if (config.tickFrequency)
            this.tickFrequency = config.tickFrequency;

        this.events = new EventBus("start", "tick", "clear", "end");
        if (config.events)
            this.subscribe(config.events);
    },
    setLength: function (length){
        this.length = length;
    },
    subscribe: function (events) {
        for (var type in events)
            this.events.on(type, events[type].bind(this));
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