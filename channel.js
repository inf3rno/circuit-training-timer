var extend = function (Ancestor, properties) {
    var Descendant = function () {
        if (this.init instanceof Function)
            this.init.apply(this, arguments);
    };
    Descendant.prototype = Object.create(Ancestor.prototype);
    if (properties)
        for (var property in properties)
            Descendant.prototype[property] = properties[property];
    Descendant.prototype.constructor = Descendant;
    Descendant.extend = function (properties) {
        return extend(this, properties);
    };
    return Descendant;
};

var abstractMethod = function () {
    throw new SyntaxError("Called abstract method.");
};
var abstractClass = function () {
    throw new SyntaxError("Instantiated abstract class.");
};

var Connectable = extend(Object, {
    init: abstractClass,
    subscribe: abstractMethod,
    unsubscribe: abstractMethod,
    publish: abstractMethod,
    pipe: abstractMethod,
    unpipe: abstractMethod
});

var Channel = Connectable.extend({
    init: function () {
        this.id = uniqueId();
        this.subscriptions = {};
        this.pipes = {};
    },
    subscribe: function (subscription) {
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
    },
    pipe: function (channel) {
        var subscription = new Subscription({
            subscriber: channel.publish,
            context: channel
        });
        this.pipes[channel.id] = subscription;
        this.subscribe(subscription);
        return channel;
    },
    unpipe: function (channel) {
        var subscription = this.pipes[channel.id];
        this.unsubscribe(subscription);
    }
});

var Worker = Connectable.extend({
    logic: abstractMethod,
    channel: undefined,
    init: function (config) {
        if (this.constructor === Worker)
            abstractClass();
        this.channel = new Channel();
        if (config)
            this.update(config);
    },
    subscribe: function (subscription) {
        return this.channel.subscribe(subscription);
    },
    unsubscribe: function (subscription) {
        this.channel.unsubscribe(subscription);
    },
    publish: abstractMethod,
    pipe: function (channel) {
        return this.channel.pipe(channel);
    },
    unpipe: function (channel) {
        this.channel.unpipe(channel);
    },
    update: function (config) {
        delete(this.logic);
        delete(this.context);
        if (config.logic)
            this.logic = config.logic;
        this.context = config.context;
    }
});

var AsyncWorker = Worker.extend({
    logic: function (request, respond) {
        respond(request);
    },
    publish: function () {
        var request = [].slice.call(arguments);
        var channel = this.channel;
        this.logic.call(this.context, request, function (response) {
            channel.publish.apply(channel, response);
        });
    }
});

var SyncWorker = Worker.extend({
    logic: function () {
        return arguments;
    },
    publish: function () {
        var response = this.logic.apply(this.context, arguments);
        this.channel.publish.apply(this.channel, response);
    }
});

var Subscription = extend(Object, {
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
});

var Sequence = extend(Object, {
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
});

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
    Connectable: Connectable,
    Channel: Channel,
    Worker: Worker,
    AsyncWorker: AsyncWorker,
    SyncWorker: SyncWorker,
    Subscription: Subscription,
    Sequence: Sequence,
    uniqueId: uniqueId
});

if (typeof(module) == "object")
    module.exports = Channel;
else
    window.Channel = Channel;
