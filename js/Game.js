OnSubmit.Using("Game", "Core.Helpers", "Core.Strings", function (Game, Helpers, Strings)
{
    var w = window;
    
    Game.ViewModel = function ()
    {
        var _this = this;
        var _unlockedRecipeCategoryMap = {};

        _this.player = new Game.Player();
        
        _this.difficultyColors = ['#555', '#00DD00', '#E6DE00', '#FF8E46'];

        var _rand = function (min, max)
        {
            if (min && max)
            {
                return Math.random() * (max - min) + min;
            }
            
            return Math.random();
        }

        var _gather = function ()
        {
            var drops = [];
            var inventory = _this.player.inventory;
            var pick = inventory.pick();
            
            var resources = Game.Resources.getAll();
            for (var resourceName in resources)
            {
                var resource = resources[resourceName];
                
                // Stop processing items if the player's level is too low
                if (resource.minLevel > _this.player.level)
                {
                    break;
                }
                
                if (resourceName === "Wood")
                {
                    if (inventory.getItemAmount(resource) === 0)
                    {
                        // When player is out of wood, always drop at least 1
                        drops.push({ item: resource, amount: Math.round(_rand(1, resource.maxDropAmount))});
                    }
                    else if (resource.dropChance > _rand())
                    {
                        drops.push({ item: resource, amount: Math.ceil(_rand() * resource.maxDropAmount)});
                    }
                }
                else
                {
                    var lootModifier = pick ? (pick.lootModifiers[resource.name] ? pick.lootModifiers[resource.name] : lootModifier) : 0;
                    if (lootModifier > 0 && resource.dropChance > _rand())
                    {
                        drops.push({ item: resource, amount: lootModifier * Math.ceil(_rand() * resource.maxDropAmount)});
                    }
                }
            }
            
            var newPick = null;
            if (pick)
            {
                var newDurability = pick.durability() - 1;
                if (newDurability === 0)
                {
                    // The pick just broke.
                    // Replace it with the highest level pick in the the player's inventory.
                    newPick = this.player.inventory.getHighestLevelPick();

                    if (newPick)
                    {
                        _this.player.inventory.replacePickFromInventory(newPick);
                        // if (this.player.inventory.items[newPick.name].durabilities)
                        // {
                        //     this.player.inventory.pick.durability = this.player.inventory.items[newPick.name].durabilities.pop();
                        // }
                        // else
                        // {
                        //     this.player.inventory.pick.durability = newPick.maxDurability;
                        // }
                    }
                    else
                    {
                        _this.player.inventory.removePick();
                    }
                }
                else
                {
                    // The pick is not broken.
                    pick.durability(newDurability);
                }
            }
            
            return drops;
        };

        _this.strings = Strings.StringRepository.getStrings("str");

        _this.inventory =
        {
            visible: ko.observable(false)
        }

        _this.recipeCategories =
        {
            selection: ko.observable(),
            unlocked: ko.observableArray([])
        };

        _this.durability =
        {
            amount: ko.observable(),
            width: ko.observable(),
            backgroundColor: ko.observable(),
            visible: ko.pureComputed(
                function ()
                {
                    var pick = _this.player.inventory.pick();
                    return pick && _this.durability.amount() !== pick.maxDurability; 
                })
        };

        _this.pickImage = ko.pureComputed(
            function ()
            {
                var pick = _this.player.inventory.pick();
                return pick ? pick.image : 'images/pick-disabled.png';
            });

        _this.gatherText = ko.pureComputed(
            function ()
            {
                var pick = _this.player.inventory.pick();
                var currentPickName = pick ? pick.name : _this.strings["BareHands"];
                return Helpers.String.format(_this.strings["GatherText"], currentPickName);
            });
            
        
        _this.step = function ()
        {
            var drops = _gather();
            if (drops.length > 0)
            {
                _this.player.collect(drops);
                _this.inventory.visible(true);
            }
        };

        _this.onlyShowCraftableRecipes = ko.observable();
        _this.recipeSearchTerm = ko.observable();
        
        _this.selectedRecipe = 
        {
            item: ko.observable(),
            name: ko.pureComputed(
                function ()
                {
                    return _this.selectedRecipe.item().name;
                }),
            craftTime: ko.pureComputed(
                function ()
                {
                    var craftTimeInSeconds = _this.selectedRecipe.item().recipe.craftTime;
                    var stringId = craftTimeInSeconds === 1 ? "CraftTime" : "CraftTimePlural";
                    return Helpers.String.format(_this.strings[stringId], _this.selectedRecipe.item().recipe.craftTime);
                }),
            requirements: ko.observableArray([])
        }
        
        _this.selectRecipe = function (item, event)
        {
            var selectedItem = _this.selectedRecipe.item();
            if (selectedItem)
            {
                selectedItem.selected(false);
            }
            
            item.selected(true);
            
            if (!item.$element)
            {
                item.$element = $(event.currentTarget || event.srcElement);
            }

            _this.selectedRecipe.item(item);
        };
        
        _this.craft = function ()
        {
            var selectedItem = _this.selectedRecipe.item();
            if (!selectedItem)
            {
                return;
            }
            
            var canCraft = _this.player.inventory.canCraft(selectedItem.recipe, 1);
            if (!canCraft)
            {
                alert("Can't craft");
                return;
            }
            
            var craftTime = Math.round(selectedItem.recipe.craftTime * 1000);
            craftTime = OnSubmit.cheat ? 0 : craftTime;
            craftTime = (OnSubmit.slow ? craftTime * 10 : craftTime);
            
            selectedItem.crafting(true);

            (function (item)
            {
                var fullWidth = item.$element.width();
                item.$element.width(0).animate(
                    { width: fullWidth },
                    craftTime,
                    "linear",
                    function ()
                    {
                        item.crafting(false);
                        _this.player.craft(item);
                        _unlockNewRecipes(item);
                    });
            })(selectedItem);
        };

        var _unlockNewRecipes = function (item)
        {
            if (item.unlocks)
            {
                // The crafting of this item unlocks the recipes for at least one other item.
                ko.utils.arrayForEach(item.unlocks, function(unlockedItemName)
                {
                    _unlockRecipe(unlockedItemName, _this.player.level());
                });

                // Clear unlock list
                item.unlocks = null;
            }
        };

        var _unlockRecipe = function (itemName, unlockLevel)
        {
            var item = Game.Items.unlock(itemName, unlockLevel);

            (function(itemInnerScope)
            {
                if (!_unlockedRecipeCategoryMap[itemInnerScope.type])
                {
                    var category =
                        {
                            name: itemInnerScope.type,
                            shown: function (checkForShownRecipe)
                            {
                                var searchTerm = _this.recipeSearchTerm();
                                var onlyShowCraftableRecipes = _this.onlyShowCraftableRecipes();

                                if (_unlockedRecipeCategoryMap[itemInnerScope.type].filteredOut())
                                {
                                    return false;
                                }

                                if (searchTerm)
                                {
                                    searchTerm = searchTerm.toLowerCase();

                                    var categoryContainsSearchTerm = (itemInnerScope.type.toLowerCase().indexOf(searchTerm) >= 0);

                                    if (categoryContainsSearchTerm && !onlyShowCraftableRecipes)
                                    {
                                        // The category contains the search term and the player wants to only show craftable recipes.
                                        return true;
                                    }
                                }
                                else if (!onlyShowCraftableRecipes)
                                {
                                    // No search term was supplied and the player wants to show all recipes, craftable and uncraftable.
                                    return true;
                                }


                                // Category isn't yet necessarily shown. Show it when either of the following occur:
                                //
                                //      1. If the player wants to only show craftable recipes, then show the category only if any of its recipes can be crafted and,
                                //         if a search term was supplied, also contains it.
                                //
                                //      2. If the player wants to show all recipes, then show the category if any of its recipes contains the search term.
                                //
                                if (checkForShownRecipe)
                                {
                                    var unlockedItems = _unlockedRecipeCategoryMap[itemInnerScope.type].items();
                                    for (var i = 0, length = unlockedItems.length; i < length; i++)
                                    {
                                        var unlockedItem = unlockedItems[i];

                                        // Don't bother checking if the recipe contains the search term when the category already contains it.
                                        var checkSearchTerm = !categoryContainsSearchTerm;
                                        if (unlockedItem.shown(checkSearchTerm, false))
                                        {
                                            return true;
                                        }
                                    }

                                    return false;
                                }

                                return true;
                            },
                            visible: ko.pureComputed(
                                function ()
                                {
                                    // Recalculate whenever the inventory changes.
                                    _this.player.inventory.isDirty();

                                    return _unlockedRecipeCategoryMap[itemInnerScope.type].shown(true);
                                }),
                            filteredOut: ko.observable(false),
                            items: new ko.observableArray([ itemInnerScope ])
                        };

                    _unlockedRecipeCategoryMap[itemInnerScope.type] = category;

                    // Keep the observable array sorted
                    var itemInserted = false;

                    for (var i = 0, length = _this.recipeCategories.unlocked().length; !itemInserted && i < length; i++)
                    {
                        if (item.type > _this.recipeCategories.unlocked()[i].type)
                        {
                            _this.recipeCategories.unlocked.splice(i, 0, category);
                            itemInserted = true;
                        }
                    }

                    if (!itemInserted)
                    {
                        _this.recipeCategories.unlocked.push(category);
                    }
                }
                else
                {
                    _unlockedRecipeCategoryMap[itemInnerScope.type].items.push(itemInnerScope);
                }
            })(item);
        };
        
        (function _initialize()
        {
            // Stick is the only initially unlocked recipe.
            _unlockRecipe("Stick");

            var items = Game.Items.getAll();
            for (var itemName in items)
            {
                var item = items[itemName];
                if (item.recipe)
                {
                    item.recipe.difficulty = (function (itemInnerScope)
                    {
                        return ko.pureComputed(
                            function ()
                            {
                                return _this.player.determineRecipeDifficulty(itemInnerScope.recipe);
                            });
                    })(item);

                    item.recipe.color = (function (itemInnerScope)
                    {
                        return ko.pureComputed(
                            function ()
                            {
                                if (itemInnerScope.selected())
                                {
                                    return '#fff';
                                }
                                
                                return _this.difficultyColors[itemInnerScope.recipe.difficulty()];
                            });
                    })(item);

                    item.recipe.backgroundColor = (function (itemInnerScope)
                    {
                        return ko.pureComputed(
                            function ()
                            {
                                if (itemInnerScope.selected())
                                {
                                    return _this.difficultyColors[itemInnerScope.recipe.difficulty()];
                                }

                                return null;
                            });
                    })(item);

                    item.selected = ko.observable(false);
                    item.crafting = ko.observable(false);
                    item.shown = (function (itemInnerScope)
                    {
                        return function (checkSearchTerm, checkForShownCategory)
                        {
                            var onlyShowCraftableRecipes = _this.onlyShowCraftableRecipes();
                            var showItem = !onlyShowCraftableRecipes || _this.player.inventory.canCraft(itemInnerScope.recipe, 1);

                            if (checkSearchTerm && showItem)
                            {
                                var searchTerm = _this.recipeSearchTerm();
                                if (searchTerm)
                                {
                                    searchTerm = searchTerm.toLowerCase();

                                    // Show item if it contains the search term
                                    showItem = itemInnerScope.name.toLowerCase().indexOf(searchTerm) >= 0;
                                }
                            }

                            if (checkForShownCategory)
                            {
                                showItem = _unlockedRecipeCategoryMap[itemInnerScope.type].shown(false);
                            }

                            return showItem;
                        }
                    })(item);

                    item.visible = (function (itemInnerScope)
                    {
                        return ko.pureComputed(
                            function ()
                            {
                                // Recalculate whenever the inventory changes.
                                _this.player.inventory.isDirty();
                                
                                return itemInnerScope.shown(true, true);
                            });
                    })(item);
                }
            }
            
            _this.player.level.valueHasMutated();

            _this.player.inventory.pick.subscribe(
                function (newPick)
                {
                    if (newPick)
                    {
                        newPick.durability.subscribe(
                            function (newDurability)
                            {
                                var maxWidth = 40;
                                var width = maxWidth * newDurability / newPick.maxDurability;
                                var red = Math.floor(255 * (1 - width / maxWidth));
                                var green = Math.floor(192 * (width / maxWidth));
                                var rgb = 'rgb(' + red + ', ' + green + ', 0)';
                                
                                _this.durability.amount(newDurability);
                                _this.durability.width(width);
                                _this.durability.backgroundColor(rgb);
                            });
                    }
                });

            _this.selectedRecipe.item.subscribe(
                function (newItem)
                {
                    var requirements = newItem.recipe.requirements;
                    ko.utils.arrayForEach(newItem.recipe.requirements, function(requirement)
                    {
                        if (!requirement.currentInventory)
                        {
                            requirement.currentInventory = _this.player.inventory.getItemAmountObservable(requirement.item);
                        }
                    });

                    _this.selectedRecipe.requirements(requirements);
                });

            _this.recipeCategories.selection.subscribe(
                function (selectedCategory)
                {
                    // 'selectedCategory' is undefined when player selects "All Categories"
                    var showAllCategories = !selectedCategory;
                    ko.utils.arrayForEach(_this.recipeCategories.unlocked(), function(category)
                    {
                        category.filteredOut(!showAllCategories && category.name !== selectedCategory.name);
                    });
                });
        })();
    };

    ko.utils.registerEventHandler(w, "load",
        function ()
        {
            ko.applyBindings(new Game.ViewModel());
        });
});