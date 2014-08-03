var EventBus = function () {
    this.init.apply(this, arguments);
};
EventBus.prototype = {
    constructor: EventBus,
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