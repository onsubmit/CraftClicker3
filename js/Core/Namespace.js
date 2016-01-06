(function ()
{
    var w = window;
    var OnSubmit = w.OnSubmit = w.OnSubmit || {};

    OnSubmit.Using = function ()
    {
        if (arguments.length < 2)
        {
            return;
        }

        var namespaces = [];
        for (var i = 0, namespaceCount = arguments.length - 1; i < namespaceCount; i++)
        {
            var subNamespaces = arguments[i].split(".");
            var currentNamespace = OnSubmit;

            for (var j = 0, subNamespaceCount = subNamespaces.length; j < subNamespaceCount; j++)
            {
                currentNamespace = currentNamespace[subNamespaces[j]] = currentNamespace[subNamespaces[j]] || {};
            }

            namespaces.push(currentNamespace);
        }

        arguments[arguments.length - 1].apply(null, namespaces);
    };
})();