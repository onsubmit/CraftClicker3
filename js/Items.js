OnSubmit.Using("Game", function (Game)
{
    Game.ItemType =
    {
        Pick: "Picks",
        Bar: "Bars",
        Forge: "Forges",
        Other: "Other",
        Compression: "Compression",
        Decompression: "Decompression"
    };
    
    Game.Items = (new function ()
    {
        var _this = this;
        var _items = {};

        _this.get = function (itemName)
        {
          return _items[itemName];
        };
        
        _this.getAll = function ()
        {
            return _items;
        }

        _this.unlock = function (itemName, unlockedLevel)
        {
            var item = _items[itemName];
            item.recipe.available = true;
            item.recipe.level = unlockedLevel || 0;
            
            return item;
        };

        var _defineItems = function ()
        {
            _items["Stick"] =
            {
                type: Game.ItemType.Other,
                recipe:
                {
                    level: 0,
                    craftTime: 1,
                    requirements:
                    [
                        { item: Game.Resources.get("Wood"), amount: 2 }
                    ]
                }
            };
                
            
            _items["Wooden Pick"] =
            {
                type: Game.ItemType.Pick,
                level: 1,
                durability: 64,
                maxDurability: 64,
                lootModifiers:
                {
                    "Coal": 1,
                    "Stone": 1
                },
                recipe:
                {
                    text: "Allows for gathering Stone and Coal.",
                    unlockedBy: _items["Stick"],
                    craftTime: 2,
                    requirements:
                    [
                        { item: _items["Stick"], amount: 2 },
                        { item: Game.Resources.get("Wood"), amount: 3 }
                    ]
                },
            };
        };
        
        var _determineUnlocks = function(item)
        {
            if (item.recipe.unlockedBy)
            {
                if (!item.recipe.unlockedBy.unlocks)
                {
                    item.recipe.unlockedBy.unlocks = [];
                }

                item.recipe.unlockedBy.unlocks.push(item.name);
                delete item.recipe.unlockedBy;
            }
        };

        var _determineTotalRequirements = function(item)
        {
            item.recipe.totalRequirements = item.recipe.totalRequirements || {};
            ko.utils.arrayForEach(item.recipe.requirements, function(req)
            {
                var subItem = req.item;

                if (!subItem.recipe)
                {
                    // Resources don't have recipes.
                    if (item.recipe.totalRequirements[subItem.name])
                    {
                        item.recipe.totalRequirements[subItem.name] += req.amount;
                    }
                    else
                    {
                        item.recipe.totalRequirements[subItem.name] = req.amount;
                    }
                }
                else
                {
                    // We've already determined the total requirements of the recipe item.
                    // Let's merge them with total requirements of the parent item.
                    for (var requirementName in subItem.recipe.totalRequirements)
                    {
                        var subReqAmount = subItem.recipe.totalRequirements[requirementName];
                        if (item.recipe.totalRequirements[requirementName])
                        {
                            item.recipe.totalRequirements[requirementName] += req.amount * subReqAmount;
                        }
                        else
                        {
                            item.recipe.totalRequirements[requirementName] = req.amount * subReqAmount;
                        }
                    }
                }
            });
        };

        var _determineSellValue = function(item)
        {
            var sellValue = 0;
            for (var i = 0, length = item.recipe.requirements.length; i < length; i++)
            {
                var req = item.recipe.requirements[i];
                var subItem = req.item;
                sellValue += (req.amount * subItem.sellValue);
            }
            
            item.sellValue = sellValue * Math.ceil(item.recipe.craftTime / 10);
        };

        var _determineItemComplexity = function(item)
        {
            item.complexity = item.complexity || 0;

            // An item's complexity is simply the depth of its recipe's dependency tree.
            // Example: 0 -- Raw resources. They don't have recipes.
            // Example: 1 -- Recipes consisting entirely of raw resources: Basic Forge (requires only Stone)
            // Example: 2 -- Recipes with at least one level 1 requirement: Sturdy Forge (since it requires 4 Basic Forges)
            // Example: 3 -- Recipes with at least one level 2 requirement: Great Forge (since it requires 4 Sturdy Forges)
            for (var i = 0, length = item.recipe.requirements.length; i < length; i++)
            {
                var req = item.recipe.requirements[i];
                item.complexity = Math.max(item.complexity, 1 + req.item.complexity);
            }
        };

        var _determineMakes = function(item)
        {
            if (item.recipe && !item.recipe.makes)
            {
                item.recipe.makes = 1;
            }
        };

        (function _initialize()
        {
            _defineItems();
            
            for (var prop in _items)
            {
                var item = _items[prop];
                item.name = prop;
                item.id = item.name.replace(/ /g, '');
                
                _determineUnlocks(item);
                _determineTotalRequirements(item);
                _determineSellValue(item);
                _determineItemComplexity(item);
                _determineMakes(item);
            }
        })();
    });
});