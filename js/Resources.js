OnSubmit.Using("Game", "Core.Strings", function (Game, Strings)
{
    Game.Resources = (new function ()
    {
        var _this = this;
        
        _this.get = function (resourceName)
        {
            return _resources[resourceName];
        };
        
        _this.getAll = function ()
        {
            return _resources;
        };

        var _resources =
        {
            "Stone"       : { dropChance: 0.6,  maxDropAmount: 3, sellValue: 1 },
            "Wood"        : { dropChance: 0.6,  maxDropAmount: 2, sellValue: 1 },
            "Coal"        : { dropChance: 0.2,  maxDropAmount: 4, sellValue: 1 },
            "Copper Ore"  : { dropChance: 0.2,  maxDropAmount: 1, sellValue: 2 },
            "Iron Ore"    : { dropChance: 0.1,  maxDropAmount: 1, sellValue: 2 },
            "Tin Ore"     : { dropChance: 0.1,  maxDropAmount: 1, sellValue: 3 },
            "Gold Ore"    : { dropChance: 0.05, maxDropAmount: 1, sellValue: 3 },
            "Bauxite Ore" : { dropChance: 0.05, maxDropAmount: 1, sellValue: 4 },
            "Lead Ore"    : { dropChance: 0.05, maxDropAmount: 1, sellValue: 5 }
        };

        (function _initialize()
        {
            var _strings = Strings.StringRepository.getStrings("str");
            for (var resourceName in _resources)
            {
                var resource = _resources[resourceName];
                resource.complexity = 0;
                resource.id = resourceName.replace(/ /g, '');
                resource.name = _strings[resource.id] ? _strings[resource.id] : resourceName;
            }
            
        })();
    })
});