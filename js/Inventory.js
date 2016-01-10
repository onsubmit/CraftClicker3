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
            var itemKey = _getItemKey(item);
            if (_items[itemKey])
            {
                var currentAmount = _items[itemKey].amount();
                _items[itemKey].amount(currentAmount + amount);
            }
            else
            {
                _addNewItem(item, itemKey, amount);
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
                var newPick = new Game.Pick(item.name);
                if (!pick || pick.level < item.level)
                {
                    if (pick)
                    {
                        // Auto equip new pick if it's higher level than the current one.
                        // Place current pick back into inventory.
                        _this.mergeItem(pick, 1);
                    }

                    _this.pick(newPick);
                }
                else
                {
                    _this.mergeItem(newPick, amount);
                }
            }
            else
            {
                _this.mergeItem(item, amount);
            }
        };
        
        _this.replacePickFromInventory = function (newPick)
        {
            _this.removeItem(newPick, 1);
            _this.pick(newPick);
        };
        
        _this.removePick = function ()
        {
            _this.pick(null);
        };
        
        _this.removeItem = function (item, amount)
        {
            var currentAmount = _this.getItemAmount(item);
            _setItemAmount(item, currentAmount - amount);
            _this.isDirty.valueHasMutated();
        };

        _this.getItemAmountObservable = function (item)
        {
            var itemKey = _getItemKey(item);
            if (!_items[itemKey])
            {
                _addNewItem(item, itemKey, 0);
            }

            return _items[itemKey].amount;
        };
        
        _this.getItemAmount = function (item)
        {
            var itemKey = _getItemKey(item);
            return _items[itemKey] ? _items[itemKey].amount() : 0;
        };

        _this.getHighestLevelPick = function()
        {
            var pick = null;
            var highestLevel = 0;
            var lowestDurability = -1;
            
            for (var itemName in _items)
            {
                var item = _items[itemName].item;
                if (item.type && item.type == Game.ItemType.Pick && _this.getItemAmount(item) > 0 && item.level >= highestLevel)
                {
                    var durability = item.durability();
                    if (lowestDurability < 0 || item.level > highestLevel || (item.level === highestLevel && durability < lowestDurability))
                    {
                        // Return the pick of highest level.
                        // If there are multiple, choose the one with the lowest durability so it can be removed more quickly.
                        // Otherwise, as long as the player has unused picks in their inventory, the partially used ones will never be removed.
                        pick = item;
                        highestLevel = item.level;
                        lowestDurability = durability;
                    }
                }
            }

            return pick;
        };

        var _getItemKey = function (item)
        {
            var itemKey = item.name;
            if (item.type === Game.ItemType.Pick)
            {
                // Only picks of the same name and durability can stack
                itemKey += ':' + item.durability();
            }

            return itemKey;
        };

        var _setItemAmount = function (item, amount)
        {
            var itemKey = _getItemKey(item);

            if (amount === 0)
            {
                _this.itemsArray.remove(function (entry) { return entry.item === item; } );
                delete _items[itemKey];
            }
            else
            {
                _items[itemKey].amount(amount);
            }
        };

        var _addNewItem = function (item, itemKey, amount)
        {
            var newItem = 
            {
                item: item,
                amount: ko.observable(amount),
                metaData: ko.observable()
            };

            newItem.toString = (function (newItemInnerScope)
                {
                    return ko.pureComputed(
                        function ()
                        {
                            var itemName = newItemInnerScope.item.name;
                            var metaData = newItemInnerScope.metaData();
                            if (metaData && (newItemInnerScope.item.type !== Game.ItemType.Pick || metaData !== newItemInnerScope.item.maxDurability))
                            {
                                return itemName + ':' + metaData;
                            }

                            return itemName;
                        });
                })(newItem);

            if (item.type === Game.ItemType.Pick)
            {
                newItem.metaData = item.durability;
            }


            _items[itemKey] = newItem;

            // Keep the observable array sorted
            var items = _this.itemsArray();
            items.push(newItem);
            items.sort(
                function (a, b)
                {
                    return a.toString() > b.toString() ? 1 : -1;
                });

            _this.itemsArray(items);
        };
    };
});