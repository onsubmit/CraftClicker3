OnSubmit.Using("Core.Strings", function (CoreStrings)
{    
    var stringRepository = CoreStrings.StringRepository;
    
    stringRepository.registerSource(
        "str",
        function (strings)
        {
            strings["AllCategories"] = "All Categories";
            strings["BareHands"] = "Bare Hands";
            strings["Craft"] = "Craft";
            strings["CraftTime"] = "Craft time: {0} second"
            strings["CraftTimePlural"] = "Craft time: {0} seconds"
            strings["GatherText"] = "Gather with {0}";
            strings["HaveResources"] = "Have Resources";
        });
});