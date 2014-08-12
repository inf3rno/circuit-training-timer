var Worker = function () {
    this.init.apply(this, arguments);
};
Worker.prototype = {
    constructor: Worker,
    init: function () {
        this.id = uniqueId();
        this.input = new Channel();
        this.output = new Channel();
        this.update.apply(this, arguments);
        this.input.subscribe(function () {
            var response = this.processor.process.apply(this.processor, arguments);
            this.output.publish.apply(this.output, response);
        }.bind(this));
    },
    publish: function () {
        this.input.publish.apply(this.input, arguments);
    },
    subscribe: function () {
        this.output.subscribe.apply(this.output, arguments);
    },
    update: function () {
        this.processor = Processor.create.apply(null, arguments);
    }
};

var Processor = function () {
    this.init.apply(this, arguments);
};
Processor.prototype = {
    constructor: Processor,
    logic: function () {
        return Array.apply(null, arguments);
    },
    init: function (config) {
        this.id = uniqueId();
        if (config)
            this.update(config);
    },
    process: function () {
        var results = this.logic.apply(this.context, arguments);
        if (!(results instanceof Array))
            throw new Error("Invalid processor logic.");
        return results;
    },
    update: function (config) {
        delete(this.logic);
        this.logic = config.logic;
        this.context = config.context;
    }
};
Processor.create = function () {
    var processor;
    if (arguments[0] instanceof Processor)
        processor = arguments[0];
    else if (arguments[0] instanceof Function)
        processor = new Processor({
            logic: arguments[0],
            context: arguments[1]
        });
    else
        processor = new Processor(arguments[0]);
    return processor;
};

var Channel = function () {
    this.init.apply(this, arguments);
};
Channel.prototype = {
    constructor: Channel,
    init: function () {
        this.id = uniqueId();
        this.subscriptions = {};
    },
    subscribe: function () {
        var subscription = Subscription.create.apply(null, arguments);
        this.subscriptions[subscription.id] = subscription;
        return subscription;
    },
    unsubscribe: function (subscription) {
        delete(this.subscriptions[subscription.id]);
    },
    publish: function () {
        for (var id in this.subscriptions) {
            var subscription = this.subscriptions[id];
            subscription.notify.apply(subscription, arguments);
        }
    }
};

var Subscription = function () {
    this.init.apply(this, arguments);
};
Subscription.prototype = {
    constructor: Subscription,
    init: function (config) {
        this.id = uniqueId();
        if (config)
            this.update(config);
    },
    notify: function () {
        if (this.subscriber instanceof Function)
            this.subscriber.apply(this.context, arguments);
    },
    update: function (config) {
        this.subscriber = config.subscriber;
        this.context = config.context;
    }
};
Subscription.create = function () {
    var subscription;
    if (arguments[0] instanceof Subscription)
        subscription = arguments[0];
    else if (arguments[0] instanceof Function)
        subscription = new Subscription({
            subscriber: arguments[0],
            context: arguments[1]
        });
    else
        subscription = new Subscription(arguments[0]);
    return subscription;
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
    generator: function (previousId) {
        return ++previousId;
    },
    initial: 0
}).wrapper();


(function (helpers) {
    for (var name in helpers)
        Channel[name] = helpers[name];
})({
    Worker: Worker,
    Channel: Channel,
    Subscription: Subscription,
    Sequence: Sequence,
    uniqueId: uniqueId
});

if (typeof(module) == "object")
    module.exports = Channel;
else
    window.Channel = Channel;
