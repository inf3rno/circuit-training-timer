var Channel = require("../channel"),
    Worker = Channel.Worker,
    Subscription = Channel.Subscription,
    Sequence = Channel.Sequence,
    uniqueId = Channel.uniqueId;

describe("channel.js", function () {

    describe("Worker", function () {

        it("reflects request by default", function () {
            var worker = new Worker();
            var log = jasmine.createSpy();
            worker.subscribe(log);
            worker.publish(1, 2, 3);
            expect(log).toHaveBeenCalledWith(1, 2, 3);
        });

        it("sends the return values through the output channel", function () {

            var worker = new Worker(function (x, y) {
                return [x, y, "z"];
            });
            var log = jasmine.createSpy();
            worker.subscribe(log);
            worker.publish("x", "y");
            expect(log).toHaveBeenCalledWith("x", "y", "z");
        });

        it("can replace its logic", function () {
            var worker = new Worker();
            var log = jasmine.createSpy();
            worker.subscribe(log);
            worker.publish(1, 2, 3);
            expect(log).toHaveBeenCalledWith(1, 2, 3);
            worker.update(function () {
                var reverseOrder = function (a, b) {
                    return b - a;
                };
                return Array.apply(null, arguments).sort(reverseOrder);
            });
            worker.publish(1, 2, 3);
            expect(log).toHaveBeenCalledWith(3, 2, 1);
            worker.update(function () {
                return [arguments.length];
            });
            worker.publish(1, 2, 3);
            expect(log).toHaveBeenCalledWith(3);
        });

        it("throws error by not returning a response array", function (){

            var worker = new Worker(function (){});
            expect(function (){
                worker.publish();
            }).toThrow("Invalid processor logic.");
        });

    });

    describe("Channel", function () {

        it("delivers messages to the subscribers", function () {

            var channel = new Channel();
            var subscriber = jasmine.createSpy();
            channel.subscribe(subscriber);
            channel.publish();
            expect(subscriber).toHaveBeenCalledWith();
            channel.publish(1, 2, 3);
            expect(subscriber).toHaveBeenCalledWith(1, 2, 3);
        });

        it("maintains a set of subscriptions", function () {

            var channel = new Channel();
            var subscriber1 = jasmine.createSpy(1);
            var subscriber2 = jasmine.createSpy(2);
            var subscriber3 = jasmine.createSpy(3);
            var subscription1 = channel.subscribe(subscriber1);
            var subscription2 = channel.subscribe(subscriber2);
            var subscription3 = channel.subscribe(subscriber3);
            channel.publish(1, 2, 3);
            expect(subscriber1).toHaveBeenCalledWith(1, 2, 3);
            expect(subscriber2).toHaveBeenCalledWith(1, 2, 3);
            expect(subscriber3).toHaveBeenCalledWith(1, 2, 3);
            channel.unsubscribe(subscription2);
            channel.publish("a", "b", "c");
            expect(subscriber1).toHaveBeenCalledWith("a", "b", "c");
            expect(subscriber2).not.toHaveBeenCalledWith("a", "b", "c");
            expect(subscriber3).toHaveBeenCalledWith("a", "b", "c");
            channel.unsubscribe(subscription1);
            channel.publish(4, 5, 6);
            expect(subscriber1).not.toHaveBeenCalledWith(4, 5, 6);
            expect(subscriber2).not.toHaveBeenCalledWith(4, 5, 6);
            expect(subscriber3).toHaveBeenCalledWith(4, 5, 6);
            channel.subscribe(subscription2);
            channel.publish("d", "e", "f");
            expect(subscriber1).not.toHaveBeenCalledWith("d", "e", "f");
            expect(subscriber2).toHaveBeenCalledWith("d", "e", "f");
            expect(subscriber3).toHaveBeenCalledWith("d", "e", "f");
        });

        it("can share subscriptions", function () {

            var subscriber = jasmine.createSpy();
            var subscription = new Subscription({
                subscriber: subscriber
            });
            var channel1 = new Channel();
            channel1.subscribe(subscription);
            var channel2 = new Channel();
            channel2.subscribe(subscription);
            channel1.publish(1, 2, 3);
            channel2.publish(4, 5, 6);
            channel1.unsubscribe(subscription);
            channel1.publish("a", "b", "c");
            channel2.publish(7, 8, 9);
            expect(subscriber).toHaveBeenCalledWith(1, 2, 3);
            expect(subscriber).toHaveBeenCalledWith(4, 5, 6);
            expect(subscriber).toHaveBeenCalledWith(7, 8, 9);
            expect(subscriber).not.toHaveBeenCalledWith("a", "b", "c");
        });

    });

    describe("Subscription", function () {

        it("generates a unique id", function () {
            expect(new Subscription().id).not.toBe(new Subscription().id);
        });

        it("can notify the subscriber with message", function () {

            var subscriber = jasmine.createSpy();
            var subscription = new Subscription({
                subscriber: subscriber
            });
            subscription.notify(1, 2, 3);
            expect(subscriber).toHaveBeenCalledWith(1, 2, 3);

        });

        it("does not break without subscriber", function () {
            var subscription = new Subscription();
            expect(function () {
                subscription.notify(1, 2, 3)
            }).not.toThrow();
        });

        it("can replace the subscriber", function () {

            var subscriber = jasmine.createSpy();
            var subscriber2 = jasmine.createSpy();
            var subscription = new Subscription({
                subscriber: subscriber
            });
            subscription.notify(1, 2, 3);
            subscription.update({
                subscriber: subscriber2
            });
            subscription.notify(4, 5, 6);
            expect(subscriber).toHaveBeenCalledWith(1, 2, 3);
            expect(subscriber).not.toHaveBeenCalledWith(4, 5, 6);
            expect(subscriber2).toHaveBeenCalledWith(4, 5, 6);
            expect(subscriber2).not.toHaveBeenCalledWith(1, 2, 3);
        });

        it("can add context to the subscriber", function () {
            var log = jasmine.createSpy();
            var subscriber = function () {
                log(this);
            };
            var a = {};
            var b = {};
            var subscription = new Subscription({
                subscriber: subscriber,
                context: a
            });
            subscription.notify();
            expect(log).toHaveBeenCalledWith(a);
            subscription.update({
                subscriber: subscriber,
                context: b
            });
            subscription.notify();
            expect(log).toHaveBeenCalledWith(b);
        });


    });

    describe("Sequence", function () {

        it("generates the next state from the previous state", function () {
            var continuouslyIncreasingSequence = new Sequence({
                generator: function (previous) {
                    return ++previous;
                },
                initial: 0
            });
            expect(continuouslyIncreasingSequence.get()).toBe(0);
            expect(continuouslyIncreasingSequence.next()).toBe(1);
            expect(continuouslyIncreasingSequence.next()).toBe(2);
            expect(continuouslyIncreasingSequence.next()).toBe(3);
        });

        it("returns a wrapper which calls next state", function () {
            var sequence = new Sequence({
                generator: function (i) {
                    return ++i;
                },
                initial: 0
            });
            var wrapper = sequence.wrapper();
            expect(wrapper()).toBe(1);
            expect(wrapper()).toBe(2);
            expect(wrapper()).toBe(3);
            expect(sequence.get()).toBe(3);
        });

        it("accepts additional parameters", function () {
            var sequence = new Sequence({
                generator: function (i, j) {
                    return i + j;
                },
                initial: 0
            });
            var wrapper = sequence.wrapper();
            expect(sequence.next(1)).toBe(1);
            expect(sequence.next(2)).toBe(3);
            expect(wrapper(5)).toBe(8);
        });

        it("stores additional parameters in the wrapper", function () {
            var sequence = new Sequence({
                generator: function (i, j, k) {
                    return i + j + k;
                },
                initial: 0
            });
            var wrapper = sequence.wrapper(10);
            expect(wrapper(5)).toBe(15);
            expect(sequence.next(1, 2)).toBe(18);
            expect(wrapper(2)).toBe(30);
        });

    });

    describe("uniqueId", function () {

        it("returns unique id", function () {
            var store = {};
            for (var i = 0; i < 1000; ++i) {
                var id = uniqueId();
                if (id in store)
                    break;
                store[id] = true;
            }
            expect(i).toBe(1000);
        });

    });


});

