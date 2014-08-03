var Channel = require("../channel");

describe("channel.js", function () {

    it("does create a new channel", function () {
        expect(Channel).toBeDefined();
        expect(new Channel()).toBeDefined();
    });

});