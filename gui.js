(function (dflo) {

    var Class = dflo.Class;
    var uniqueId = dflo.uniqueId;
    var Publisher = dflo.Publisher;

    var SelectInput = Class.extend({
        el: undefined,
        changed: undefined,
        selected: undefined,
        init: function (config) {
            this.el = $("<select>").attr({class: config.class});
            if (config.selected)
                this.selected = config.selected;
            if (config.alternatives)
                for (var value in config.alternatives)
                    this.addAlternative(value, config.alternatives[value]);
            this.changed = new Publisher();
            this.el.change(function () {
                this.changed.publish(this.el.val());
            }.bind(this));
        },
        addAlternative: function (value, title) {
            var option = $("<option>").append(title || value).attr({value: value});
            if (value == this.selected)
                option.attr({selected: "selected"});
            this.el.append(option);
        },
        getValue: function () {
            return this.el.val();
        }
    });

    var CheckBox = Class.extend({
        init: function (config) {
            var id = "chk_id_" + uniqueId();
            this.input = $("<input>").attr({class: config.class, type: "checkbox", checked: config.selected ? "checked" : false, id: id});
            this.label = $("<label>").attr({for: id}).append(config.title);
            this.el = [this.input, this.label];
        },
        getValue: function () {
            return !!this.input.prop("checked");
        }
    });

    var Section = Class.extend({
        init: function (config) {
            this.el = $("<section>").attr({class: config.class});
            if (config.content)
                this.addContent(config.content);
        },
        addContent: function (content) {
            this.el.append.apply(this.el, content.map(function (view) {
                if (typeof(view) == "string")
                    return view;
                else
                    return view.el;
            }));
        }
    });

    var Display = Class.extend({
        init: function (config) {
            this.el = $("<section>").attr({class: config.class});
            if (config.text)
                this.text(config.text);
        },
        text: function (value) {
            this.el.text(value);
        }
    });

    var Button = Class.extend({
        el: undefined,
        clicked: undefined,
        init: function (config) {
            this.el = $("<button>").attr({class: config.class, disabled: config.disabled ? "disabled" : false}).append(config.title);
            this.clicked = new Publisher();
            this.el.click(function (e) {
                e.preventDefault();
                this.clicked.publish();
            }.bind(this));
        },
        enable: function () {
            this.el.prop("disabled", false);
        },
        disable: function () {
            this.el.prop("disabled", true);
        }
    });

    var Audio = Class.extend({
        init: function (config) {
            this.el = $("<audio>").attr({class: config.class, src: config.source});
            this.audio = this.el.get(0);
        },
        replay: function () {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.play();
        }
    });


    window.gui = {
        Section: Section,
        Display: Display,
        SelectInput: SelectInput,
        CheckBox: CheckBox,
        Button: Button,
        Audio: Audio
    };

})(window.dflo);