OnSubmit.Using("Game", function (Game)
{
    Game.Pick = function (pickName)
    {
        var _this = this;
        var _item = Game.Items[pickName];

        _this.level = _item.level;
        _this.durability = ko.observable(_item.durability);
        _this.maxDurability = _item.maxDurability;
        _this.lootModifiers = _item.lootModifiers;
    };
});