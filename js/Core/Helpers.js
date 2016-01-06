OnSubmit.Using("Core.Helpers", function (Helpers)
{
    Helpers.String =
    {
        format: function (str)
        {
            /// <summary>Replaces indexed portions of a string with the corresponding value passed in the arguments.
            /// ie: If the string was 'Text {0} text {1} text {0}', each {0} would be replaced with the second argument
            /// passed in, and each {1} would be replaced with the third argument passed in, etc.</summary>
            /// <param name="str">(String) The String to replace tokens in</param>
            /// <param name="arg2">(string) String to replace each occurence of {0} with</param>
            /// <param name="arg3">(string) String to replace each occurence of {1} with</param>
            /// <returns>A new String with parameters replaced</returns>

            for (var i = 1; i < arguments.length; i++)
            {
                str = str.replace(new RegExp("\\{" + (i - 1) + "\\}", "g"), arguments[i]);
            }

            return str;
        },
    };
});