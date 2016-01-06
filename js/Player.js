OnSubmit.Using("Game", function (Game)
{
    Game.Player = function ()
    {
        var _this = this;
        
        _this.level = ko.observable(0);
        _this.maxLevel = 2;
        _this.inventory = new Game.Inventory();
        _this.requiredRecipes = [];
        _this.skillIncreaseChanges = [0, 0.25, 0.75, 1];
        _this.xpPercentages = [0, 0.2, 0.325, 0.9];

        _this.money = 0;
        _this.xp   = 0;
        _this.xpMax = 20;
        
        _this.collect = function (drops)
        {
            for (var prop in drops)
            {
                var drop = drops[prop];
                _this.inventory.mergeItem(drop.item, drop.amount);
            }
        };

        _this.craft = function (item)
        {
            _this.inventory.craft(item);

            /*
            // Consume the resources from the inventory.
            var numToSell = this.inventory.craft(requiredRecipe);
            if (numToSell > 0)
            {
                this.sellItem(item, numToSell);
            }
            */
        };

        _this.determineRecipeDifficulty = function (recipe)
        {
            var diff = _this.level() - recipe.level;
            if (diff < 5)
            {
                return 3;
            }

            if (diff < 10)
            {
                return 2;
            }

            if (diff < 15)
            {
                return 1;
            }

            return 0;
        };
    };
});