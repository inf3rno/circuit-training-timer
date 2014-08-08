var Channel = function () {
    this.init();
};
Channel.prototype = {
    constructor: Channel,
    init: function () {

    }
};

var Sequence = function () {
    this.init.apply(this, arguments);
};
Sequence.prototype = {
    constructor: Sequence,
    init: function (config) {
        this.state = config.initial;
        this.generator = config.generator;
    },
    get: function () {
        return this.state;
    },
    next: function () {
        var args = [this.state];
        args.push.apply(args, arguments);
        this.state = this.generator.apply(this, args);
        return this.get();
    },
    wrapper: function () {
        var store = [];
        store.push.apply(store, arguments);
        return function () {
            var args = [];
            args.push.apply(args, store);
            args.push.apply(args, arguments);
            return this.next.apply(this, args);
        }.bind(this);
    }
};

var uniqueId = new Sequence({
    generator: function (previous) {
        return ++previous;
    },
    initial: 0
}).wrapper();


(function (helpers) {
    for (var name in helpers)
        Channel[name] = helpers[name];
})({
    Sequence: Sequence,
    uniqueId: uniqueId
});

if (typeof(module) == "object")
    module.exports = Channel;
else
    window.Channel = Channel;
