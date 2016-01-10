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
            strings["NoForge"] = "No forge equipped";
            strings["NoPick"] = "No pick equipped";
            strings["Pick"] = "Pick";
            strings["RequiresForge"] = "Requires <a href='#' class='requiredForge'>{0}</a>";
            strings["SellsFor"] = "Sells for {0}";
            strings["Unlocks"] = "Unlocks: {0}";

            strings.makeListString = function (array)
            {
                if (!array || array.length === 0)
                {
                    return "";
                }

                var listString = "";
                for (var i = 0, length = array.length; i < length; i++)
                {
                    listString += array[i];
                    if (i < length - 1)
                    {
                        if (length > 2)
                        {
                            listString += ", "
                        }

                        if (i == length - 2)
                        {
                            listString += " and ";
                        }
                    }
                }

                return listString;
            };

            strings.makeMoneyString = function (money)
            {
                var copper = Math.floor(money % 100);
                money = Math.floor((money - copper) / 100);
                var silver = Math.floor(money % 100);
                var gold = Math.floor((money - silver) / 100);

                var moneyString = '';
                moneyString += gold > 0 ? gold + 'g ' : '';
                moneyString += silver > 0 ? silver + 's ' : '';
                moneyString += moneyString.length > 0 ? (copper > 0 ? copper + 'c' : '') : copper + 'c';

                return moneyString;
            };
        });
});