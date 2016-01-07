OnSubmit.Using("Core.Strings", function (CoreStrings)
{    
    var stringRepository = CoreStrings.StringRepository;
    
    stringRepository.registerSource(
        "str",
        function (strings)
        {
            strings["AllCategories"] = "All Categories";
            strings["BareHands"] = "Bare Hands";
            strings["Cancel"] = "Cancel";
            strings["Craft"] = "Craft";
            strings["CraftAll"] = "Craft All";
            strings["CraftTime"] = "Craft time: {0} second"
            strings["CraftTimePlural"] = "Craft time: {0} seconds"
            strings["GatherText"] = "Gather with {0}";
            strings["HaveResources"] = "Have Resources";
        });
});