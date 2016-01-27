OnSubmit.Using("Game", function (Game)
{
    Game.Player = function ()
    {
        var _this = this;
        var _skillIncreaseChanges = [0, 0.25, 0.75, 1];
        var _xpPercentages = [0, 0.2, 0.325, 0.9];
        
        _this.level = ko.observable(0);
        _this.maxLevel = ko.observable(2);
        _this.inventory = new Game.Inventory();
        _this.requiredRecipes = [];

        _this.money = ko.observable(0);
        _this.xp = ko.observable(0);
        _this.xpMax = ko.observable(20);

        var _addXP = function (recipe, xpModifier)
        {
            var diff = _this.determineRecipeDifficulty(recipe);
            var xpPercentIncrease = _xpPercentages[diff];
            if (xpPercentIncrease > 0)
            {
                var currentXP = _this.xp();
                _this.xp(currentXP + Math.round(xpModifier * _this.xpMax() * (xpPercentIncrease + 0.05 * Math.random()) / (_this.level() + 1)));
            }

            if (_this.xp() >= _this.xpMax())
            {
                _levelUp();
            }
        };

        var _levelUp = function ()
        {
            _this.level(_this.level() + 1);
            _this.xp(_this.xp() - _this.xpMax());
            _this.xpMax(_this.xpMax() + _this.level() * 2);
        };
        
        _this.collect = function (drops)
        {
            for (var prop in drops)
            {
                var drop = drops[prop];
                _this.inventory.mergeItem(drop.item, drop.amount);
            }
        };

        _this.craft = function (item, xpModifier)
        {
            _addXP(item.recipe, xpModifier);

            // Consume the resources from the inventory.
            var craftInfo = _this.inventory.craft(item);
            if (craftInfo.numToSell)
            {
                _sellItem(item, numToSell);
            }

            return craftInfo.continueCrafting;
        };

        _this.sellItem = function (item, amount)
        {
            var multiplier = 1;
            if (req.item.type === Game.ItemType.Forge || req.item.type === Game.ItemType.Pick)
            {
                // Damaged items sell for less
                multiplier = item.metaData() / item.maxDurability;
            }

            _this.money(_this.money() + Math.ceil(amount * item.sellValue * multiplier));
        }

        _this.moneyString = ko.pureComputed(
            function ()
            {
                var money = _this.money();
                var copper = Math.floor(money % 100);
                money = Math.floor((money - copper) / 100);
                var silver = Math.floor(money % 100);
                var gold = Math.floor((money - silver) / 100);

                var moneyString = '';
                moneyString += gold > 0 ? gold + 'g ' : '';
                moneyString += silver > 0 ? silver + 's ' : '';
                moneyString += moneyString.length > 0 ? (copper > 0 ? copper + 'c' : '') : copper + 'c';

                return moneyString;
            })

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