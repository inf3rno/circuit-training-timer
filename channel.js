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

var Channel = extend(Object, {
    init: function () {
        this.id = uniqueId();
        this.subscriptions = {};
        this.pipes = {};
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
    },
    pipe: function (channel) {
        var subscription = this.subscribe(channel.publish, channel);
        this.pipes[channel.id] = subscription;
        return channel;
    },
    unpipe: function (channel) {
        var subscription = this.pipes[channel.id];
        this.unsubscribe(subscription);
    }
});

var Worker = Channel.extend({
    logic: function (request, respond) {
        respond(request);
    },
    init: function () {
        Channel.prototype.init.call(this);
        this.update.apply(this, arguments);
    },
    publish: function () {
        var request = [].slice.call(arguments);
        this.logic.call(this.context, request, function (response) {
            Channel.prototype.publish.apply(this, response);
        }.bind(this));
    },
    update: function () {
        delete(this.logic);
        delete(this.context);
        if (arguments[0] instanceof Function) {
            this.logic = arguments[0];
            this.context = arguments[1];
        }
        else if (arguments[0] instanceof Object) {
            var config = arguments[0];
            if (config.logic)
                this.logic = config.logic;
            this.context = config.context;
        }
    }
});

var SyncWorker = Worker.extend({
    logic: function () {
        return arguments;
    },
    publish: function (){
        var response = this.logic.apply(this.context, arguments);
        Channel.prototype.publish.apply(this, response);
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
    Worker: Worker,
    SyncWorker: SyncWorker,
    Channel: Channel,
    Subscription: Subscription,
    Sequence: Sequence,
    uniqueId: uniqueId
});

if (typeof(module) == "object")
    module.exports = Channel;
else
    window.Channel = Channel;
