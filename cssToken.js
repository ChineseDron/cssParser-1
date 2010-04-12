/* See license.txt */
function CssToken(startCoord) {
  this.startCoord = startCoord;
  this.endCoord = startCoord;
  this.text = "";
  this.value = "";
}
CssToken.prototype = {
  append: function(value) {
    if (!value) {
      return;
    }

    if (value instanceof CssToken) {
      this.value += value.value;
      this.text += value.text;
      return;
    }

    // Extract the value from the regex match
    value = value[0];

    this.text += value;
    if (value[0] === "\\") {
      // We have to do some unescaping here
      var escaped = value.substr(1);
      if (!(/[0-9a-f]/i.test(escaped))) {
        this.value += escaped;
      } else {
        this.value += String.fromCharCode(parseInt(escaped, 16));
      }
    } else {
      this.value += value;
    }
  },
  toString: function() {
    var startCoord = this.startCoord.line + ":" + this.startCoord.col,
        endCoord = this.endCoord.line + ":" + this.endCoord.col;

    return (this.production || "") + ":" + startCoord + "-" + endCoord + ":" + this.value;
  }
};
