var Channel = function () {
    this.init.apply(this, arguments);
};
Channel.prototype = {
    constructor: Channel,
    init: function () {
        this.id = uniqueId();
        this.subscriptions = {};
    },
    has: function (subscription) {
        return (subscription.id in this.subscriptions);
    },
    subscribe: function () {
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
    Subscription: Subscription,
    Sequence: Sequence,
    uniqueId: uniqueId
});

if (typeof(module) == "object")
    module.exports = Channel;
else
    window.Channel = Channel;
