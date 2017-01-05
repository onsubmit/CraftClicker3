OnSubmit.Using("Game", "Core.Helpers", "Core.Strings", function (Game, Helpers, Strings)
{
    var w = window;

    var InventorySortType = Game.InventorySortType;
    var Items = Game.Items;
    var ItemType = Game.ItemType;
    var Player = Game.Player;
    var Resources = Game.Resources;

    Game.ViewModel = function ()
    {
        var _this = this;
        var _unlockedRecipeCategoryMap = {};
        var _cachedElements = {};

        _this.player = new Player();
        _this.difficultyColors = ['#555', '#00DD00', '#E6DE00', '#FF8E46'];
        _this.strings = Strings.StringRepository.getStrings("str");

        _this.inventory =
        {
            visible: ko.observable(false),
            keepHelp:
                {
                    visible: ko.observable(false),
                    shown: ko.observable(false),
                    show: function ()
                        {
                            _this.inventory.keepHelp.visible(true);
                            _this.inventory.keepHelp.shown(true);
                        },
                    hide: function () { _this.inventory.keepHelp.visible(false); }
                },
            sortByOptions: ko.observableArray(
                [
                    { value: _this.strings["SortByAlphabetical"], type: InventorySortType.Alphabetical },
                    { value: _this.strings["SortByAmount"], type: InventorySortType.Amount }
                ]),
            sortedBy: ko.observable(),
            searchTerm: ko.observable(),
            reverse: ko.observable(),
            currentReverse: false,
            currentSortBy: null,
            lastSortTime: 0,
            doSort: function ()
                {
                    if (_this.inventory.currentReverse !== _this.inventory.reverse() ||
                        _this.inventory.currentSortBy !== _this.inventory.sortedBy())
                    {
                        // Player changed the checked state of the "Reverse" checkbox
                        return true;
                    }

                    // Otherwise only sort once ever second at a maximum
                    var elapsed = new Date().getTime() - _this.inventory.lastSortTime;
                    return elapsed > 1000;
                },
            sortedArray: ko.pureComputed(
                function ()
                {
                    var sortBy = _this.inventory.sortedBy();
                    var reverse = _this.inventory.reverse();
                    var searchTerm = _this.inventory.searchTerm();
                    var items = _this.player.inventory.itemsArray();

                    function sort(x, y)
                    {
                        if (x === y)
                        {
                            return 0;
                        }
                        else if (x > y)
                        {
                            result = 1;
                        }
                        else
                        {
                            result = -1;
                        }

                        if (reverse)
                        {
                            result = 0 - result;
                        }

                        return result;
                    }

                    // Only sort once per second
                    if (_this.inventory.doSort())
                    {
                        if (sortBy === InventorySortType.Amount)
                        {
                            items.sort(function (a, b) { return sort(a.amount(), b.amount()); });
                        }
                        else
                        {
                            items.sort(function (a, b) { return sort(a.id, b.id); });
                        }

                        _this.inventory.lastSortTime = new Date().getTime();
                    }
                    else
                    {
                        // We still need to read the amount observable to ensure the subscriptions are set up.
                        ko.utils.arrayForEach(items, function(item)
                        {
                            var hamburgers = item.amount();
                        });
                    }

                    if (searchTerm)
                    {
                        searchTerm = searchTerm.toLowerCase();
                        ko.utils.arrayForEach(items, function(item)
                        {
                            item.visible(item.id.toLowerCase().indexOf(searchTerm) >= 0);
                        });
                    }
                    else
                    {
                        ko.utils.arrayForEach(items, function(item)
                        {
                            item.visible(true);
                        });
                    }

                    _this.inventory.currentReverse = _this.inventory.reverse();
                    _this.inventory.currentSortBy = _this.inventory.sortedBy();
                    return items;
                })
        };

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
                        var forge = _this.player.inventory.forge();
                        return forge && _this.forge.durability.amount() !== forge.maxDurability;
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

        _this.playerInfo =
        {
            xp:
            {
                width: ko.pureComputed(
                    function ()
                    {
                        var maxWidth = 290;
                        return Math.round(maxWidth * _this.player.xp() / _this.player.xpMax()) + 'px';
                    })
            },
            level:
            {
                showDetails: ko.observable(false),
                text: ko.pureComputed(
                    function ()
                    {
                        if (_this.playerInfo.level.showDetails())
                        {
                            return Math.round(_this.player.xp()) + ' / ' + _this.player.xpMax();
                        }

                        return Helpers.String.format(_this.strings["Level"], _this.player.level());
                    })
            },
            click: function ()
            {
                _this.playerInfo.level.showDetails(!_this.playerInfo.level.showDetails());
            }
        };

        _this.gatherText = ko.pureComputed(
            function ()
            {
                var pick = _this.player.inventory.pick();
                var currentPickName = pick ? pick.name : _this.strings["BareHands"];
                return Helpers.String.format(_this.strings["GatherText"], currentPickName);
            });

        _this.gatherUntilPickBreaks = ko.observable(false);

        _this.step = function ()
        {
            if (_this.gathering())
            {
                // Prevent gather spam
                return;
            }

            var gatherTime = OnSubmit.cheat ? 0 : 250 + 750 * ((250 - Math.min(_this.player.level(), 250)) / 250.0);
            var pick = _this.player.inventory.pick();
            if (pick)
            {
                // Picks get faster as they break
                gatherTime = gatherTime / (4.0 - 3.0 * Math.sqrt(pick.getDurabilityPercentage()))
            }

            _this.gathering(true);

            // Show a progress bar indicating gathering is happening
            var $gatherProgress = _getElement("#gatherProgress");
            var fullWidth = $gatherProgress.width();

            $gatherProgress
                .stop()
                .removeClass("done")
                .css("visibility", "visible")
                .css("opacity", "1")
                .width(0)
                .animate(
                    { width: fullWidth },
                    gatherTime,
                    "linear",
                    function ()
                    {
                        var drops = _gather();
                        if (drops.length > 0)
                        {
                            _this.player.collect(drops);
                            _this.inventory.visible(true);
                        }

                        _this.gathering(false);
                        if (_this.gatherUntilPickBreaks() && _this.player.inventory.pick())
                        {
                            // Invoking _this.step() directly blows up the stack
                            setTimeout(_this.step, 0);
                        }
                        else
                        {
                            // Flash the progress bar green indicating gathering is done
                            $gatherProgress
                                .addClass("done")
                                .fadeTo(1000, 0,
                                    function ()
                                    {
                                        $gatherProgress.css("visibility", "hidden");
                                    });
                        }
                    });
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
        _this.gathering = ko.observable();
        _this.allowAction = ko.pureComputed(
            function()
            {
                return !_this.itemBeingCrafted() && !_this.gathering();
            }
        )

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
            item.selected(true);
        };

        _this.selectRecipeByRequirement = function(requirement)
        {
            requirement.item.selected(true);

            var $recipeScroll = $("#recipeScroll");
            $recipeScroll.scrollTop(requirement.item.getElement().offset().top - $recipeScroll.offset().top + $recipeScroll.scrollTop());
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
            item.getElement().stop(true, true);
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

            var resources = Resources.getAll();
            for (var resourceName in resources)
            {
                var resource = resources[resourceName];

                // Stop processing items if the player's level is too low
                if (resource.minLevel > _this.player.level)
                {
                    break;
                }

                var lootModifier = 0;
                if (resourceName === "Wood")
                {
                    lootModifier = 1;
                }
                else if (pick && pick.lootModifiers[resource.name])
                {
                    lootModifier = pick.lootModifiers[resource.name];
                }

                if (lootModifier > 0 && resource.dropChance > _rand())
                {
                    drops.push({ item: resource, amount: lootModifier * Math.ceil(_rand() * resource.maxDropAmount)});
                }
            }

            if (pick)
            {
                var newDurability = pick.metaData() - 1;
                if (newDurability > 0)
                {
                    // The pick is not broken.
                    pick.metaData(newDurability);
                }
                else
                {
                    // The pick just broke.
                    // Replace it with the highest level pick in the the player's inventory.
                    var bestPick = _this.player.inventory.getHighestLevelItem(ItemType.Pick);
                    if (bestPick)
                    {
                        var newPick = new Game.Pick(bestPick.item.name, bestPick.metaData);
                        _this.player.inventory.replacePickFromInventory(newPick, bestPick.metaData);
                    }
                    else
                    {
                        _this.player.inventory.removePick();
                    }
                }
            }

            if (drops.length === 0)
            {
                // Always at least drop a little wood
                drops.push({ item: Resources.get("Wood"), amount: Math.round(_rand(1, resource.maxDropAmount))});
            }

            return drops;
        };

        var _craft = function (craftAsManyAsPossible)
        {
            if (_this.itemBeingCrafted())
            {
                // Prevent crafting if it's already happening.
                return;
            }

            var selectedItem = _this.selectedRecipe.item();
            if (!selectedItem)
            {
                return;
            }

            selectedItem.crafting(true);
            _this.itemBeingCrafted(selectedItem);

            var amount = (!craftAsManyAsPossible && parseInt(_this.craftAmount.value())) || 1;
            var canCraft = _this.player.inventory.canCraft(selectedItem.recipe, amount);
            if (!canCraft)
            {
                alert("Can't craft");
                selectedItem.crafting(false);
                _this.itemBeingCrafted(null);
                _this.craftAmount.value(1);
                return;
            }

            var craftTime = Math.round(selectedItem.recipe.craftTime * 1000);
            craftTime = OnSubmit.cheat ? 0 : craftTime;
            craftTime = (OnSubmit.slow ? craftTime * 10 : craftTime);

            var counter = 0;
            (function doCraft (item)
            {
                if (craftAsManyAsPossible)
                {
                    _this.craftAmount.value(counter++);
                }

                var fullWidth = item.getElement().width();
                item.getElement().width(0).animate(
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

                        var xpModifier = Math.max(1, item.recipe.craftTime / 5.0);
                        var continueCrafting =_this.player.craft(item, xpModifier);
                        _unlockNewRecipes(item);

                        if (continueCrafting && (--amount > 0 || (craftAsManyAsPossible && _this.player.inventory.canCraft(selectedItem.recipe, 1))))
                        {
                            if (!craftAsManyAsPossible)
                            {
                                _this.craftAmount.value(amount);
                            }

                            setTimeout(function () { doCraft(item); }, 0);
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
            var item = Items.unlock(itemName, unlockLevel);

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

        var _calculateDurability = function(newDurability, maxDurability)
        {
            var maxWidth = 40;
            var width = maxWidth * newDurability / maxDurability;
            var red = Math.floor(255 * (1 - width / maxWidth));
            var green = Math.floor(192 * (width / maxWidth));
            var rgb = 'rgb(' + red + ', ' + green + ', 0)';
            return { width: width, rgb: rgb };
        };

        function _getElement(selector)
        {
            return _cachedElements[selector] || (_cachedElements[selector] = $(selector));
        }

        (function _initialize()
        {
            // Stick is the only initially unlocked recipe.
            _unlockRecipe("Stick");

            var items = Items.getAll();
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

                    item.getElement = (function (itemInnerScope)
                    {
                        return function ()
                        {
                            if (!itemInnerScope.$element)
                            {
                                itemInnerScope.$element = $(".selectedRecipe");
                            }

                            return itemInnerScope.$element;
                        }
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
                        newPick.metaData.subscribe(
                            function (newDurability)
                            {
                                var bar = _calculateDurability(newDurability, newPick.maxDurability);
                                _this.pick.durability.amount(newDurability);
                                _this.pick.durability.width(bar.width + 'px');
                                _this.pick.durability.backgroundColor(bar.rgb);
                            });

                        newPick.metaData.valueHasMutated();
                    }
                });

            _this.player.inventory.forge.subscribe(
                function (newForge)
                {
                    if (newForge)
                    {
                        newForge.metaData.subscribe(
                            function (newDurability)
                            {
                                var bar = _calculateDurability(newDurability, newForge.maxDurability);
                                _this.forge.durability.amount(newDurability);
                                _this.forge.durability.width(bar.width + 'px');
                                _this.forge.durability.backgroundColor(bar.rgb);
                            });

                        newForge.metaData.valueHasMutated();
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
                                            return _this.player.inventory.getTotalItemAmountObservable(item)();
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
                    if (!_this.itemBeingCrafted())
                    {
                        _this.craftAll();
                    }
                }
                else if (e.which == 71 || e.which == 103) // '[Gg]'
                {
                    if (!_this.itemBeingCrafted())
                    {
                        _this.step();
                    }
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