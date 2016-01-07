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

            _items["Copper Bar"] =
            {
                type: Game.ItemType.Bar,
                recipe:
                {
                    craftTime: 3,
                    requirements:
                    [
                        { item: Game.Resources.get("Copper Ore"), amount: 1 },
                        { item: Game.Resources.get("Coal"), amount: 1 },
                    ]
                }
            };

            _items["Iron Bar"] =
            {
                type: Game.ItemType.Bar,
                recipe:
                {
                    craftTime: 3,
                    requirements:
                    [
                        { item: Game.Resources.get("Iron Ore"), amount: 1 },
                        { item: Game.Resources.get("Coal"), amount: 1 },
                    ]
                }
            };

            _items["Tin Bar"] =
            {
                type: Game.ItemType.Bar,
                recipe:
                {
                    craftTime: 3,
                    requirements:
                    [
                        { item: Game.Resources.get("Tin Ore"), amount: 1 },
                        { item: Game.Resources.get("Coal"), amount: 1 },
                    ]
                }
            };

            _items["Gold Bar"] =
            {
                type: Game.ItemType.Bar,
                recipe:
                {
                    craftTime: 3,
                    requirements:
                    [
                         { item: Game.Resources.get("Gold Ore"), amount: 1 },
                         { item: Game.Resources.get("Coal"), amount: 1 },
                    ]
                }
            };

            _items["Bronze Bar"] =
            {
                type: Game.ItemType.Bar,
                recipe:
                {
                    craftTime: 3,
                    requirements:
                    [
                          { item: _items["Tin Bar"], amount: 1 },
                          { item: _items["Copper Bar"], amount: 1 },
                          { item: Game.Resources.get("Coal"), amount: 1 },
                    ]
                }
            };

            _items["Bronze Rivet"] =
            {
                type: Game.ItemType.Other,
                recipe:
                {
                    craftTime: 16,
                    makes: 16,
                    requirements:
                    [
                        { item: _items["Bronze Bar"], amount: 1 },
                    ]
                }
            };

            _items["Steel Bar"] =
            {
                type: Game.ItemType.Bar,
                recipe:
                {
                    craftTime: 3,
                    requirements:
                    [
                        { item: _items["Iron Bar"], amount: 1 },
                        { item: Game.Resources.get("Coal"), amount: 1 },
                    ]
                }
            };

            _items["Aluminum Bar"] =
            {
                type: Game.ItemType.Bar,
                recipe:
                {
                    craftTime: 3,
                    makes: 2,
                    requirements:
                    [
                        { item: Game.Resources.get("Bauxite Ore"), amount: 1 },
                        { item: Game.Resources.get("Iron Ore"), amount: 1 },
                        { item: Game.Resources.get("Coal"), amount: 1 },
                    ]
                }
            };

            _items["Aluminum Strips"] =
            {
                type: Game.ItemType.Other,
                recipe:
                {
                    craftTime: 8,
                    makes: 8,
                    requirements:
                    [
                        { item: _items["Aluminum Bar"], amount: 1 },
                    ]
                }
            };

            _items["Lead Bar"] =
            {
                type: Game.ItemType.Bar,
                recipe:
                {
                    craftTime: 3,
                    requirements:
                    [
                        { item: Game.Resources.get("Lead Ore"), amount: 3 },
                        { item: Game.Resources.get("Coal"), amount: 1 },
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
                }
            };

            _items["Stone Pick"] =
            {
                type: Game.ItemType.Pick,
                lootModifiers: {},
                recipe:
                {
                    text: "Allows for gathering Iron and Copper ore.",
                    unlockedBy: _items["Wooden Pick"],
                    craftTime: 3,
                    requirements:
                    [
                        { item: _items["Stick"], amount: 2 },
                        { item: Game.Resources.get("Stone"), amount: 3 }
                    ]
                }
            }

            _improvePick(_items["Stone Pick"], _items["Wooden Pick"]);
            _items["Stone Pick"].lootModifiers["Copper Ore"] = 1;
            _items["Stone Pick"].lootModifiers["Iron Ore"] = 1;

            _items["Cast Iron Pick"] =
            {
                type: Game.ItemType.Pick,
                lootModifiers: {},
                recipe:
                {
                    text: "Allows for gathering Gold and Tin ore.",
                    unlockedBy: _items["Stone Pick"],
                    craftTime: 3,
                    requirements:
                    [
                        { item: _items["Stick"], amount: 2 },
                        { item: _items["Iron Bar"], amount: 3 }
                    ]
                }
            }

            _improvePick(_items["Cast Iron Pick"], _items["Stone Pick"]);
            _items["Cast Iron Pick"].lootModifiers["Tin Ore"] = 1;
            _items["Cast Iron Pick"].lootModifiers["Gold Ore"] = 1;

            _items["Gold Pick"] =
            {
                type: Game.ItemType.Pick,
                lootModifiers: {},
                recipe:
                {
                    text: "Allows for gathering Bauxite ore.",
                    unlockedBy: _items["Cast Iron Pick"],
                    craftTime: 3,
                    requirements:
                    [
                        { item: _items["Stick"], amount: 2 },
                        { item: _items["Gold Bar"], amount: 3 }
                    ]
                }
            }

            _improvePick(_items["Gold Pick"], _items["Cast Iron Pick"]);
            _items["Gold Pick"].lootModifiers["Bauxite Ore"] = 1;

            _items["Steel Pick"] =
            {
                type: Game.ItemType.Pick,
                lootModifiers: {},
                recipe:
                {
                    text: "Allows for gathering Lead ore.",
                    unlockedBy: _items["Gold Pick"],
                    craftTime: 12,
                    requirements:
                    [
                        { item: _items["Stick"], amount: 2 },
                        { item: _items["Steel Bar"], amount: 3 },
                        { item: _items["Bronze Rivet"], amount: 4 },
                        { item: _items["Aluminum Strips"], amount: 8 },
                    ]
                }
            }

            _improvePick(_items["Steel Pick"], _items["Gold Pick"]);
            _items["Steel Pick"].lootModifiers["Lead Ore"] = 1;

            _items["Copper Bar"].recipe.unlockedBy = _items["Stone Pick"];
            _items["Iron Bar"].recipe.unlockedBy = _items["Stone Pick"];
            _items["Tin Bar"].recipe.unlockedBy = _items["Cast Iron Pick"];
            _items["Gold Bar"].recipe.unlockedBy = _items["Cast Iron Pick"];
            _items["Steel Bar"].recipe.unlockedBy = _items["Gold Pick"];
            _items["Bronze Bar"].recipe.unlockedBy = _items["Gold Pick"];
            _items["Bronze Rivet"].recipe.unlockedBy = _items["Gold Pick"];
            _items["Aluminum Bar"].recipe.unlockedBy = _items["Gold Pick"];
            _items["Aluminum Strips"].recipe.unlockedBy = _items["Gold Pick"];
            _items["Lead Bar"].recipe.unlockedBy = _items["Steel Pick"];
        };

        var _improvePick = function(newPick, oldPick)
        {
            newPick.level = oldPick.level + 1;
            newPick.durability = oldPick.durability * 2;
            newPick.maxDurability = newPick.durability;
            for (var prop in oldPick.lootModifiers)
            {
                newPick.lootModifiers[prop] = oldPick.lootModifiers[prop];
            }
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
                item.image = 'images/' + item.id + '.png';

                _determineUnlocks(item);
                _determineTotalRequirements(item);
                _determineSellValue(item);
                _determineItemComplexity(item);
                _determineMakes(item);
            }
        })();
    });
});