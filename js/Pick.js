OnSubmit.Using("Game", function (Game)
{
    Game.Pick = function (pickName, metaData)
    {
        var _this = this;
        var _item = Game.Items.get(pickName);

        _this.name = _item.name;
        _this.type = _item.type;
        _this.image = _item.image;
        _this.level = _item.level;
        _this.metaData = ko.observable(metaData !== undefined ? metaData : _item.maxDurability);
        _this.maxDurability = _item.maxDurability;
        _this.lootModifiers = _item.lootModifiers;

        _this.hasDurability = true;

        _this.getDurabilityPercentage = function ()
        {
            return _this.metaData() * 1.0 / _this.maxDurability;
        };
    };
});