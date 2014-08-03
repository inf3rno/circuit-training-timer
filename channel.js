var Channel = function () {
    this.init();
};
Channel.prototype = {
    constructor: Channel,
    init: function () {

    }
};

if (typeof(module) == "object")
    module.exports = Channel;
else
    window.Channel = Channel;
