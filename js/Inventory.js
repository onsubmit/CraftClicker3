OnSubmit.Using("Game", function (Game)
{
    Game.Inventory = function ()
    {
        var _this = this;
        var _items = {};
        
        _this.itemsArray = ko.observableArray([]);
        _this.pick = ko.observable();
        _this.isDirty = ko.observable(false);
        
        _this.mergeItem = function(item, amount)
        {
            var itemKey = item.name;
            if (item.type === Game.ItemType.Pick)
            {
                // Only picks of the same name and durability can stack
                itemKey += ' (' + item.durability + ')';
            }

            if (_items[itemKey])
            {
                var currentAmount = _items[itemKey].amount();
                _items[itemKey].amount(currentAmount + amount);
            }
            else
            {
                _addNewItem(item, amount);
            }

            _this.isDirty.valueHasMutated();
        };
        
        _this.canCraft = function (recipe, amount, allowDependentCrafting, effectiveItems)
        {
            amount = amount || 1;
            effectiveItems = effectiveItems || {};
            allowDependentCrafting = allowDependentCrafting || false;
            
            for (var i = 0, length = recipe.requirements.length; i < length; i++)
            {
                var req = recipe.requirements[i];
                if (!effectiveItems[req.item.name])
                {
                    effectiveItems[req.item.name] = _items[req.item.name] ? _items[req.item.name].amount() : 0;
                }
                
                if (req.item.recipe)
                {
                    // Requirement is some other item
                    if (effectiveItems[req.item.name] < amount * req.amount)
                    {
                        // Not enough of the required item in the inventory
                        if (allowDependentCrafting)
                        {
                            if (!_this.canCraft(req.item.recipe, req.amount, true, effectiveItems))
                            {
                                return false;
                            }
                        }
                        else
                        {
                            return false;
                        }
                    }
                    else
                    {
                        effectiveItems[req.item.name] -= amount * req.amount;
                    }
                }
                else
                {
                    // Requirement is a raw resource
                    if (effectiveItems[req.item.name] < amount * req.amount)
                    {
                        // Not enough of the required resource in the inventory
                        return false;
                    }
                    else
                    {
                        effectiveItems[req.item.name] -= amount * req.amount;
                    }
                }
            }
            
            return true;
        };

        _this.craft = function (item, amount)
        {
            amount = amount || 1;
            
            ko.utils.arrayForEach(item.recipe.requirements, function(req)
            {
                _this.removeItem(req.item, amount * req.amount);
            });

            if (item.type === Game.ItemType.Pick)
            {
                var pick = _this.pick();
                if (!pick || pick.level < item.level)
                {
                    if (pick)
                    {
                        // Auto equip new pick if it's higher level than the current one.
                        // Place current pick back into inventory.
                        _this.mergeItem(pick, 1);
                    }

                    _this.pick(new Game.Pick(item.name));
                    return;
                }
            }

            _this.mergeItem(item, amount);
        };
        
        _this.replacePickFromInventory = function (newPick)
        {
            _this.removeItem(newPick, 1);
            _this.pick(new Game.Pick(newPick.name));
        };
        
        _this.removePick = function ()
        {
            _this.pick(null);
        };
        
        _this.removeItem = function (item, amount)
        {
            var currentAmount = _this.getItemAmount(item);
            _items[item.name].amount(currentAmount - amount);

            _this.isDirty.valueHasMutated();
        };

        _this.getItemAmountObservable = function (item)
        {
            if (!_items[item.name])
            {
                _addNewItem(item, 0);
            }

            return _items[item.name].amount;
        };
        
        _this.getItemAmount = function (item)
        {
            return _items[item.name] ? _items[item.name].amount() : 0;
        };
        
        _this.getHighestLevelPick = function()
        {
            var pick = null;
            var highestLevel = 0;
            
            for (var itemName in _items)
            {
                var item = _items[itemName].item;
                if (item.type && item.type == Game.ItemType.Pick && _items[itemName].amount > 0 && item.level > highestLevel)
                {
                    pick = item;
                    highestLevel = item.level;
                }
            }

            return pick;
        };

        var _addNewItem = function (item, amount)
        {
            var newItem = 
            {
                item: item,
                amount: ko.observable(amount)
            };

            _items[item.name] = newItem;

            // Keep the observable array sorted
            var items = _this.itemsArray();
            items.push(newItem);
            items.sort(
                function (a, b)
                {
                    return a.item.name > b.item.name ? 1 : -1;
                });

            _this.itemsArray(items);
        };
    };
});