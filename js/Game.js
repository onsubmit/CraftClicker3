OnSubmit.Using("Game", "Core.Helpers", "Core.Strings", function (Game, Helpers, Strings)
{
    var w = window;
    
    Game.ViewModel = function ()
    {
        var _this = this;
        var _unlockedRecipeCategoryMap = {};

        _this.player = new Game.Player();
        _this.difficultyColors = ['#555', '#00DD00', '#E6DE00', '#FF8E46'];
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

        _this.pick =
        {
            durability:
            {
                amount: ko.observable(),
                width: ko.observable(),
                backgroundColor: ko.observable(),
                visible: ko.pureComputed(
                    function ()
                    {
                        var pick = _this.player.inventory.pick();
                        return pick && _this.pick.durability.amount() !== pick.maxDurability; 
                    })
            },
            image: ko.pureComputed(
                function ()
                {
                    var pick = _this.player.inventory.pick();
                    return pick ? pick.image : 'images/pick-disabled.png';
                }),
            name: ko.pureComputed(
                function ()
                {
                    var pick = _this.player.inventory.pick();
                    return pick ? pick.name : _this.strings["NoPick"];
                })
        };

        _this.forge =
        {
            durability:
            {
                amount: ko.observable(),
                width: ko.observable(),
                backgroundColor: ko.observable(),
                visible: ko.pureComputed(
                    function ()
                    {
                        var pick = _this.player.inventory.forge();
                        return pick && _this.forge.durability.amount() !== forge.maxDurability; 
                    })
            },
            image: ko.pureComputed(
                function ()
                {
                    var forge = _this.player.inventory.forge();
                    return forge ? forge.image : 'images/forge-disabled.png';
                }),
            name: ko.pureComputed(
                function ()
                {
                    var forge = _this.player.inventory.forge();
                    return forge ? forge.name : _this.strings["NoForge"];
                })
        };

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

        _this.craftAmount =
        {
            value: ko.observable(1),
            onFocus: function (data, event)
            {
                var target = event.target || event.srcElement;
                target.select();
            }
        };

        _this.itemBeingCrafted = ko.observable();

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
            unlocks: ko.pureComputed(
                function ()
                {
                    var unlocks = _this.selectedRecipe.item().unlocks;
                    if (unlocks)
                    {
                        var list = _this.strings.makeListString(unlocks)
                        return Helpers.String.format(_this.strings["Unlocks"], list);
                    }

                    return "";
                }),
            description: ko.pureComputed(
                function ()
                {
                    return _this.selectedRecipe.item().recipe.text;
                }),
            sellsFor: ko.pureComputed(
                function ()
                {
                    var sellsFor = _this.strings.makeMoneyString(_this.selectedRecipe.item().sellValue);
                    return Helpers.String.format(_this.strings["SellsFor"], sellsFor);
                }),
            requiredForge:
            {
                item: function ()
                {
                    return _this.selectedRecipe.item().recipe.forge;
                },
                name: ko.pureComputed(
                    function ()
                    {
                        var forge = _this.selectedRecipe.item().recipe.forge;
                        if (forge)
                        {
                            return Helpers.String.format(_this.strings["RequiresForge"], forge.name);
                        }

                        return null;
                    }),
                isMissing: ko.pureComputed(
                    function ()
                    {
                        var forge = _this.selectedRecipe.item().recipe.forge;
                        if (forge)
                        {
                            var playerForge = _this.player.inventory.forge();
                            return (playerForge && playerForge.level >= forge.level);
                        }

                        return false;
                    })
            },
            requirements: ko.observableArray([])
        }
        
        _this.selectRecipe = function (item, event)
        {
            if (!item.$element)
            {
                // Store a reference to the element.
                // It is used only during setup and cancellation of the crafting animation.
                item.$element = $(event.currentTarget || event.srcElement);
            }

            item.selected(true);
        };

        _this.selectRecipeByRequirement = function(requirement)
        {
            requirement.item.selected(true);
        };

        _this.selectRecipeByForge = function(forge)
        {
            forge.requiredForge.item().selected(true);
        };

        _this.allowCraft = ko.pureComputed(
            function ()
            {
                return _this.selectedRecipe.item();
            });

        _this.cancelCraft = function ()
        {
            var item = _this.itemBeingCrafted();
            item.crafting(false);
            _this.itemBeingCrafted(null);
            item.$element.stop(true, true);
        };

        _this.craftAll = function ()
        {
            _craft(true);
        }
        
        _this.craft = function ()
        {
            _craft(false);
        };

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
                    var lootModifier = (pick && pick.lootModifiers[resource.name]) || 0;
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
                    newPick = _this.player.inventory.getHighestLevelPick();

                    if (newPick)
                    {
                        _this.player.inventory.replacePickFromInventory(newPick);
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

        var _craft = function (craftAsManyAsPossible)
        {
            var selectedItem = _this.selectedRecipe.item();
            if (!selectedItem)
            {
                return;
            }

            var amount = (!craftAsManyAsPossible && parseInt(_this.craftAmount.value())) || 1;
            var canCraft = _this.player.inventory.canCraft(selectedItem.recipe, amount);
            if (!canCraft)
            {
                alert("Can't craft");
                _this.craftAmount.value(1);
                return;
            }
            
            var craftTime = Math.round(selectedItem.recipe.craftTime * 1000);
            craftTime = OnSubmit.cheat ? 0 : craftTime;
            craftTime = (OnSubmit.slow ? craftTime * 10 : craftTime);
            
            selectedItem.crafting(true);
            _this.itemBeingCrafted(selectedItem);

            var counter = 0;
            (function doCraft (item)
            {
                if (craftAsManyAsPossible)
                {
                    _this.craftAmount.value(counter++);
                }

                var fullWidth = item.$element.width();
                item.$element.width(0).animate(
                    { width: fullWidth },
                    craftTime,
                    "linear",
                    function ()
                    {
                        if (!_this.itemBeingCrafted())
                        {
                            // Crafting was cancelled
                            // Reset craft amount to 1
                            _this.craftAmount.value(1);
                            return;
                        }

                        _this.player.craft(item);
                        _unlockNewRecipes(item);

                        if (--amount > 0 || (craftAsManyAsPossible && _this.player.inventory.canCraft(selectedItem.recipe, 1)))
                        {
                            if (!craftAsManyAsPossible)
                            {
                                _this.craftAmount.value(amount);
                            }

                            doCraft(item);
                        }
                        else
                        {
                            item.crafting(false);
                            _this.itemBeingCrafted(null);
                            _this.craftAmount.value(1);
                        }
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
                                        // The category contains the search term and the player wants to show all recipes.
                                        return true;
                                    }
                                }
                                else if (!onlyShowCraftableRecipes)
                                {
                                    // No search term was supplied and the player wants to show all recipes.
                                    return true;
                                }


                                // Category isn't yet necessarily shown. Show it when either of the following occur:
                                //
                                //      1. If the player wants to only show craftable recipes, then show the category only if any of its recipes can be crafted and,
                                //         if a search term was supplied, contains it as well.
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
                                else
                                {
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
                    var unlocked = _this.recipeCategories.unlocked();
                    unlocked.push(category);
                    unlocked.sort(
                        function (a, b)
                        {
                            return a.name > b.name ? 1 : -1;
                        });

                    _this.recipeCategories.unlocked(unlocked);
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
                                if (itemInnerScope.selected() || itemInnerScope.crafting())
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
                                if (itemInnerScope.selected() || itemInnerScope.crafting())
                                {
                                    return _this.difficultyColors[itemInnerScope.recipe.difficulty()];
                                }

                                return null;
                            });
                    })(item);

                    item.selected = ko.observable(false);
                    item.crafting = ko.observable(false);
                    (function (itemInnerScope)
                    {
                        itemInnerScope.selected.subscribe(function (newValue)
                            {
                                if (newValue)
                                {
                                    var selectedItem = _this.selectedRecipe.item();

                                    if (!selectedItem)
                                    {
                                        _this.selectedRecipe.item(itemInnerScope);
                                    }
                                    else if (selectedItem !== itemInnerScope)
                                    {
                                        selectedItem.selected(false);
                                        _this.selectedRecipe.item(itemInnerScope);
                                    }
                                }
                            });
                    })(item);

                    item.shown = (function (itemInnerScope)
                    {
                        return function (checkSearchTerm, checkForShownCategory)
                        {
                            var onlyShowCraftableRecipes = _this.onlyShowCraftableRecipes();

                            if (checkSearchTerm)
                            {
                                var searchTerm = _this.recipeSearchTerm();
                                var containsSearchTerm = false;
                                if (searchTerm)
                                {
                                    searchTerm = searchTerm.toLowerCase();
                                    containsSearchTerm = itemInnerScope.name.toLowerCase().indexOf(searchTerm) >= 0;
                                }

                                if (onlyShowCraftableRecipes)
                                {
                                    // The player only wants to see craftable recipes
                                    var canCraft = _this.player.inventory.canCraft(itemInnerScope.recipe, 1);
                                    if (!canCraft)
                                    {
                                        // Item can't be crafted, don't show it.
                                        return false;
                                    }

                                    if (containsSearchTerm || !searchTerm)
                                    {
                                        // Item can be crafted and either contains the search term or none was suplied.
                                        return true;
                                    }
                                    else
                                    {
                                        return (itemInnerScope.type.toLowerCase().indexOf(searchTerm) >= 0);
                                    }
                                }
                                else if (containsSearchTerm || !searchTerm)
                                {
                                    // Player wants to see all recipes, and the item either contains the search term or none was suplied.
                                    return true;
                                }
                                else if (checkForShownCategory)
                                {
                                    // A recipe can still be displayed if its category contains the search term.
                                    return (itemInnerScope.type.toLowerCase().indexOf(searchTerm) >= 0);
                                }
                            }
                            else if (onlyShowCraftableRecipes)
                            {
                                // 'checkSearchTerm' is only ever false when we already know the items category contains the search term.
                                // The player only wants to see craftable recipes, so display this recipe only if its craftable.
                                return _this.player.inventory.canCraft(itemInnerScope.recipe, 1);
                            }

                            return false;
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
                                
                                _this.pick.durability.amount(newDurability);
                                _this.pick.durability.width(width + 'px');
                                _this.pick.durability.backgroundColor(rgb);
                            });

                        newPick.durability.valueHasMutated();
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
                            requirement.currentInventory = (function (item)
                                {
                                    return ko.pureComputed(
                                        function ()
                                        {
                                            return _this.player.inventory.getItemAmountObservable(item)();
                                        });
                                })(requirement.item);
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

            $(document).keypress(function(e)
            {
                var target = e.target || e.srcElement;
                if (target.tagName.toLowerCase() === 'input')
                {
                    return;
                }

                e.preventDefault(); // Prevent page down on hitting space bar
                if (e.which === 32) // space
                {
                    if (_this.itemBeingCrafted())
                    {
                        _this.cancelCraft();
                    }
                    else
                    {
                        _this.craft();
                    }
                }
                else if (e.which  == 65 || e.which == 97) // '[Aa]'
                {
                    _this.craftAll();
                }
                else if (e.which == 71 || e.which == 103) // '[Gg]'
                {
                    _this.step();
                }
                else if (e.which >= 49 && e.which <= 57) // '[1-9]'
                {
                    if (!_this.itemBeingCrafted())
                    {
                        var amount = e.which - 48;
                        _this.craftAmount.value(amount);
                        _craft(false);
                    }
                }
            });
        })();
    };

    ko.utils.registerEventHandler(w, "load",
        function ()
        {
            ko.applyBindings(new Game.ViewModel());

            // Select the first recipe by default
            $('.recipeCategory li').first().click();
        });
});