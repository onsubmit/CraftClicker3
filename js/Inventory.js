OnSubmit.Using("Game", function (Game)
{
    Game.InventorySortType =
    {
        Alphabetical: "Alphabetical",
        Amount: "Amount"
    };

    Game.Inventory = function ()
    {
        var _this = this;
        var _items = {};
        
        _this.itemsArray = ko.observableArray([]);
        _this.pick = ko.observable();
        _this.forge = ko.observable();
        _this.isDirty = ko.observable(false);
        
        _this.mergeItem = function(item, amount, metaDataId)
        {
            metaDataId = parseInt(metaDataId) || 0;
            var inventoryItem = _items[item.name];
            if (inventoryItem)
            {
                var metaDataAmount = inventoryItem.amounts[metaDataId];
                if (metaDataAmount)
                {
                    var currentAmount = metaDataAmount.amount();
                    metaDataAmount.amount(currentAmount + amount);
                }
                else
                {
                    _addNewItem(item, amount, metaDataId);
                }
            }
            else
            {
                _addNewItem(item, amount, metaDataId);
            }

            _this.isDirty.valueHasMutated();
        };
        
        _this.canCraft = function (recipe, amount, effectiveItems)
        {
            amount = amount || 1;
            effectiveItems = effectiveItems || {};

            if (recipe.forge)
            {
                // Recipe requires a forge.
                // Ensure the player has a forge of at least the required level.
                var forge = _this.forge();
                if (!forge || forge.level < recipe.forge.level)
                {
                    return false;
                }
            }
            
            for (var i = 0, length = recipe.requirements.length; i < length; i++)
            {
                var req = recipe.requirements[i];
                var reqName = req.item.name;
                if (!effectiveItems[reqName])
                {
                    effectiveItems[reqName] = _items[reqName] ? _this.getItemAmount(_items[reqName].item) : 0;
                    if (req.item.type === Game.ItemType.Forge)
                    {
                        var forge = _this.forge();
                        if (forge && forge.level === req.item.level)
                        {
                            effectiveItems[reqName]++;
                        }
                    }
                }

                var amountNeeded = amount * req.amount;
                if (effectiveItems[reqName] >= amountNeeded)
                {
                    effectiveItems[reqName] -= amountNeeded;
                }
                else
                {
                    // Not enough of the required item or resource in the inventory
                    return false;
                }
            }
            
            return true;
        };

        _this.craft = function (item, amount)
        {
            amount = amount || 1;
            var recipe = item.recipe;
            var continueCrafting = true;
            
            ko.utils.arrayForEach(recipe.requirements, function(req)
            {
                if (req.item.type === Game.ItemType.Forge)
                {
                    for (var i = 0; i < req.amount; i++)
                    {
                        var forge = _this.forge();
                        var lowestDurability = _getLowestDurabilityOfItem(req.item.name);
                        if (lowestDurability < 0 || forge.metaData() < lowestDurability)
                        {
                            // The equipped forge is the chosen forge to be used in the craft.
                            // Replace it with the highest level forge in the the player's inventory.
                            var newForge = _this.getHighestLevelItem(Game.ItemType.Forge);
                            if (newForge)
                            {
                                _this.replaceForgeFromInventory(newForge.item, newForge.metaData);
                            }
                            else
                            {
                                _this.removeForge();
                            }
                        }
                        else
                        {
                            _this.removeItem(req.item, 1, lowestDurability);
                        }
                    }
                }
                else
                {
                    _this.removeItem(req.item, amount * req.amount);
                }
            });

            if (item.type === Game.ItemType.Bar)
            {
                var forge = _this.forge();
                var newDurability = forge.metaData() - 1;
                if (newDurability === 0)
                {
                    // The forge just broke.
                    // Replace it with the highest level forge in the the player's inventory.
                    var newForge = _this.getHighestLevelItem(Game.ItemType.Forge);
                    if (newForge)
                    {
                        _this.replaceForgeFromInventory(newForge.item, newForge.metaData);
                    }
                    else
                    {
                        _this.removeForge();
                    }
                }
                else
                {
                    // The forge is not broken.
                    forge.metaData(newDurability);
                }
            }
            else if (item.type === Game.ItemType.Pick)
            {
                var pick = _this.pick();
                if (!pick || pick.level < item.level)
                {
                    if (pick)
                    {
                        // Auto equip new pick if it's higher level than the current one.
                        // Place current pick back into inventory.
                        _this.mergeItem(pick, 1, pick.metaData());
                    }

                    _this.pick(new Game.Pick(item.name));
                    return;
                }
                else
                {
                    item = new Game.Pick(item.name);
                }
            }
            else if (item.type === Game.ItemType.Forge)
            {
                var forge = _this.forge();
                if (!forge || forge.level < item.level)
                {
                    if (forge)
                    {
                        // Auto equip new forge if it's higher level than the current one.
                        // Place current forge back into inventory.
                        _this.mergeItem(forge, 1, forge.metaData());
                    }

                    _this.forge(new Game.Forge(item.name));
                    return;
                }
                else
                {
                    item = new Game.Forge(item.name);
                }
            }

            _this.mergeItem(item, amount * recipe.makes);

            if (recipe.forge)
            {
                var forge = _this.forge();
                if (!forge || forge.level < recipe.forge.level)
                {
                    // The player is not prevented from attempting to craft 'n' bars when their forge has a durability of less than 'n'.
                    // If the forge breaks before they can craft all 'n' and cannot be replaced by a forge of sufficient level to craft another bar, cancel the craft.
                    continueCrafting = false;
                }
            }

            return continueCrafting;
        };
        
        _this.replacePickFromInventory = function (newPick, metaDataId)
        {
            _this.removeItem(newPick, 1, metaDataId);
            _this.pick(newPick);
        };

        _this.replaceForgeFromInventory = function (newForge, metaDataId)
        {
            _this.removeItem(newForge, 1, metaDataId);
            _this.forge(newForge);
        };
        
        _this.removePick = function ()
        {
            _this.pick(null);
        };

        _this.removeForge = function ()
        {
            _this.forge(null);
        };
        
        _this.removeItem = function (item, amount, metaDataId)
        {
            metaDataId = parseInt(metaDataId) || 0;
            var currentAmount = _this.getItemAmount(item, metaDataId);
            _setItemAmount(item, currentAmount - amount, metaDataId);
            _this.isDirty.valueHasMutated();
        };

        _this.getItemAmount = function (item, metaDataId)
        {
            if (!metaDataId && metaDataId !== 0)
            {
                if (!_items[item.name])
                {
                    _addNewItem(item, 0, 0);
                    return 0;
                }

                var amount = 0;
                var amounts = _items[item.name].amounts;
                for (var id in amounts)
                {
                    amount += amounts[id].amount();
                }

                return amount;
            }

            return _items[item.name].amounts[metaDataId].amount();
        };

        _this.getTotalItemAmountObservable = function (item)
        {
            var itemName = item.name;
            if (!_items[itemName])
            {
                _this.mergeItem(item, 0);
                
            }
            
            return _items[itemName].total;
        };

        _this.getHighestLevelItem = function(itemType)
        {
            var bestItem = null;
            var highestLevel = 0;
            var lowestDurability = -1;
            
            for (var itemName in _items)
            {
                var item = _items[itemName].item;
                if (item.type && item.type === itemType && _this.getItemAmount(item) > 0 && item.level >= highestLevel)
                {
                    var durability = item.metaData();
                    if (lowestDurability < 0 || item.level > highestLevel || (item.level === highestLevel && durability < lowestDurability))
                    {
                        // Return the pick/forge of highest level.
                        // If there are multiple, choose the one with the lowest durability so it can be removed more quickly.
                        // Otherwise, as long as the player has unused picks/forges in their inventory, the partially used ones will never be removed.
                        bestItem = item;
                        highestLevel = item.level;
                        lowestDurability = durability;
                    }
                }
            }

            if (bestItem)
            {
                return { item: bestItem, metaData: lowestDurability };
            }
        };

        var _setItemAmount = function (item, amount, metaDataId)
        {
            metaDataId = parseInt(metaDataId) || 0;
            _items[item.name].amounts[metaDataId].amount(amount);
            _this.isDirty.valueHasMutated();
        };

        var _getItemString = function (item)
        {
            var itemName = item.name;
            var metaData = item.metaData && item.metaData();
            if (item.hasDurability)
            {
                if (metaData && item.maxDurability && metaData !== item.maxDurability)
                {
                    return itemName + ':' + metaData;
                }
            }
            else if (metaData)
            {
                return itemName + ':' + metaData;
            }

            return itemName;
        };

        var _getLowestDurabilityOfItem = function (itemName)
        {
            var lowestDurability = -1;
            if (_items[itemName])
            {
                for (var durability in _items[itemName].amounts)
                {
                    if (lowestDurability < 0 || durability < lowestDurability)
                    {
                        lowestDurability = durability;
                    }
                }
            }

            return lowestDurability;
        };

        var _addNewItem = function (item, amount, metaDataId)
        {
            var inventoryItem = _items[item.name];
            if (!inventoryItem)
            {
                inventoryItem = { item: item, amounts: {}, total: ko.observable(0).extend({ rateLimit: 50 }) };
                _items[item.name] = inventoryItem;
            }

            if (!inventoryItem.amounts[metaDataId])
            {
                inventoryItem.amounts[metaDataId] =
                {
                    amount: ko.observable(amount).extend({ rateLimit: 50 }),
                    toString: (function (itemInnerScope)
                    {
                        return ko.pureComputed(
                            function ()
                            {
                                return _getItemString(itemInnerScope);
                            });
                    })(item)
                };

                (function (inventoryItem, metaDataId)
                {
                    inventoryItem.amounts[metaDataId].amount.subscribe(
                        function (newAmount)
                        {
                            var total = 0;
                            for (var id in inventoryItem.amounts)
                            {
                                total += inventoryItem.amounts[id].amount();
                            }

                            inventoryItem.total(total);
                        });
                })(inventoryItem, metaDataId);

                inventoryItem.amounts[metaDataId].amount.valueHasMutated();
            }

            _this.itemsArray.push(
                {
                    id: inventoryItem.amounts[metaDataId].toString(),
                    amount: inventoryItem.amounts[metaDataId].amount,
                    visible: ko.observable(true)
                });
        }
    };
});