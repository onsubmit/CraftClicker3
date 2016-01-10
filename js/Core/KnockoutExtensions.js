ko.bindingHandlers.numeric =
{
    init: function (element, valueAccessor)
    {
        $(element).on("keydown", function (event)
        {
            if (event.keyCode == 46 || event.keyCode == 8 ||                        // Allow backspace and delete
                event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 || // Allow tab, escape, and enter
                (event.keyCode == 65 && event.ctrlKey === true) ||                  // Allow ctrl+a
                (event.keyCode >= 35 && event.keyCode <= 39))                       // Allow home, end, left, right
            {
                return;
            }
            else
            {
                // Ensure that it is a number and stop the keypress
                if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105))
                {
                    event.preventDefault();
                }
            }
        });
    }
};

ko.bindingHandlers.htmlWithBindings =
{
    init: function ()
    {
        return { controlsDescendantBindings: true };
    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext)
    {
        ko.utils.setHtml(element, valueAccessor());

        var childBindings = allBindings.get("childBindings");
        if (childBindings)
        {
            for (var selector in childBindings)
            {
                var child = $(element).children(selector)[0];
                if (child)
                {
                    ko.applyBindingsToNode(child, childBindings[selector], bindingContext);
                }
            }
        }
        else
        {
            ko.applyBindingsToDescendants(bindingContext, element);
        }
    }
};