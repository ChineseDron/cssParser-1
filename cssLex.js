/* See license.txt */
var cssLex;

(function() {
  const NON_ASCII_ESCAPED = 1,
      ESCAPED_NEWLINE = 2,
      NUMBER = 3,
      WHITESPACE = 4,
      COMMENT_START = 5,
      COMMENT_END = 6,
      STATICS = 7,
      STRING = 8,
      START_CHARS = 9;
  const AT_RULES = {
      "@import": "(import)",
      "@page": "(page)",
      "@media": "(media)"
  };
  const UNIT_TYPES = {
      "em": "(ems)",
      "ex": "(exs)",
      "px": "(length)",
      "cm": "(length)",
      "mm": "(length)",
      "in": "(length)",
      "pt": "(length)",
      "pc": "(length)",
      "deg": "(angle)",
      "rad": "(angle)",
      "grad": "(angle)",
      "ms": "(time)",
      "s": "(time)",
      "hz": "(freq)",
      "khz": "(freq)",
  };

  // Converts the string into the most basic forms that do not support new lines (or are themselves newlines)
  var charMatcher = /([\u0200-\uffff]|\\[0-9a-fA-F]{1,6}(?:\r\n|[ \t\r\n\f])?|\\[^\r\n\f0-9a-f])|(\\(?:\n|\r\n|\r|\f))|([0-9]*\.?[0-9]+)|([ \t\r\n\f]+?)|(\/\*)|(\*\/)|(<!--|-->|~=|\|=|@charset )|(["'])|([-_a-zA-Z#@!])|(.)/g;

  cssLex = function(input) {
    // TODO : Is it possible to make curState not a global?
    var curState = new CssToken({line: 1, col: 0}), curHandler, urlParams, importantToken;

    function nmCharHandler(productionHelper) {
      return function helper(curToken) {
        if (curToken && (curToken[NON_ASCII_ESCAPED] || !(/[^_a-z0-9-]/i.test(curToken[0])))) {
          curState.append(curToken);
          return helper;
        } else if (curToken[0] === "(") {
          if (curState.value.toLowerCase() === "url") {
            curState.append(curToken);
            urlParams = new CssToken();
            return urlHandler;
          } else if (curState.value[0] !== "#" && curState[0] !== "@"){
            curState.append(curToken);
            curState.production = "(function)";
            return;
          }
        }

        curState.production = typeof productionHelper === "function" ? productionHelper() : productionHelper;

        return false;
      }
    }

    function numberUnitHandler(curToken) {
      if (curToken && (curToken[NON_ASCII_ESCAPED] || !(/[^_a-z0-9-]/i.test(curToken[0])))) {
        curUnit.append(curToken);
        curState.append(curToken);

        var type = UNIT_TYPES[curUnit.value.toLowerCase()];
        if (type) {
          curState.production = type;
        } else {
          return numberUnitHandler;
        }
      } else {
        curState.production = curUnit.text.length ? "(dimension)" : "(number)";
        return false;
      }
    }

    function urlHandler(curToken) {
      if (curToken[WHITESPACE]) {
        urlParams.append(curToken);
        return urlHandler;
      } else if (curToken[0] === ")") {
        urlParams.append(curToken);
        curState.append(urlParams);
        curState.production = "(url)";
        return;
      } else if (curToken[0] === "\"" || curToken[0] === "'") {
        urlParams.stringMode = curToken[0];
        urlParams.append(curToken);
        return urlStringHandler;
      } else if (curToken[NON_ASCII_ESCAPED] || !/[^!#$%&*\-~]/g.test(curToken[0])) {
        urlParams.append(curToken);
        return urlHandler;
      }

      curState.production = "(function)";
      return false;
    }
    function urlStringHandler(curToken) {
      // Emit until we hit another one of ourselves, an unescaped newline
      if (curToken && (curToken[ESCAPED_NEWLINE] || !(/[\n\r\f]/.test(curToken[0])))) {
        var terminate = curState.value && curToken[0] === urlParams.stringMode;

        urlParams.append(curToken);

        if (terminate) {
          return urlTailSpaceHandler;
        } else {
          return urlStringHandler;
        }
      }

      curState.production = "(function)";
      return false;
    }
    function urlDataHandler(curToken) {
      if (curToken[NON_ASCII_ESCAPED] || !/[^!#$%&*\-~]/g.test(curToken[0])) {
        urlParams.append(curToken);
      } else if (curToken[0] === ")") {
        urlParams.append(curToken);
        curState.append(urlParams);
        curState.production = "(url)";
        return;
      } else if (curToken[WHITESPACE]) {
        urlParams.append(curToken);
        return urlDataHandler;
      }
      curState.production = "(function)";
      return false;
    }
    function urlTailSpaceHandler(curToken) {
      if (curToken[0] === ")") {
        urlParams.append(curToken);
        curState.append(urlParams);
        curState.production = "(url)";
        return;
      } else if (curToken[WHITESPACE]) {
        urlParams.append(curToken);
        return urlTailSpaceHandler;
      }
      curState.production = "(function)";
      return false;
    }

    function importantHandler(curToken) {
      if (curToken[WHITESPACE]) {
        curState.append(curToken);
        return importantHandler;
      } else if (curToken[COMMENT_START]) {
        curState.append(curToken);
        return function importantCommentHandler(curToken) {
          curState.append(curToken);
          if (curToken[COMMENT_END]) {
            return importantHandler;
          } else {
            return importantCommentHandler;
          }
        };
      } else {
        importantToken = new CssToken();
        return importantTextHandler(curToken);
      }
    }
    function importantTextHandler(curToken) {
      if (curToken && (curToken[NON_ASCII_ESCAPED] || !(/[^_a-z0-9-]/i.test(curToken[0])))) {
        importantToken.append(curToken);
        if ("important".indexOf(importantToken.value.toLowerCase()) === 0) {
          if (importantToken.value.toLowerCase() === "important") {
            // TODO : Make sure that this is escaped
            curState.append(importantToken);
            curState.production = "(important)";
            return;
          } else {
            return importantTextHandler;
          }
        }
      }
      curState.value = "!";
      curState.text = "!";
      return false;
    }
    function singleTokenHandler(curToken) {
      curState.append(curToken);
    }

    const handlers = [
        //  nonascii|escape
        nmCharHandler("(ident)"),
        //  escaped newLine
        singleTokenHandler,
        //  number
        function(curToken) {
          curState.append(curToken);
          return function(curToken) {
            // TODO : Handle curToken === undefined
            if (curToken[0] === "%") {
              curState.append(curToken);
              curState.production = "(percentage)";
            } else {
              curUnit = new CssToken({line: input.lineNum, col: charMatcher.lastIndex});
              return numberUnitHandler(curToken);
            }
          }
        },
        //  whitespace
        function(curToken) {
          curState.append(curToken);
          return function child(curToken) {
            // TODO : Handle curToken === undefined
            if (curToken && !/\S/.test(curToken[0])) {
              curState.append(curToken);
              return child;
            } else {
              curState.production = "(whitespace)";
              return false;
            }
          }
        },
        //  /*
        function commentHandler(curToken) {
            // TODO : Handle curToken === undefined
          curState.append(curToken);
          curState.production = "(comment)";
          return (!curToken[COMMENT_END] && commentHandler) || undefined;
        },
        //  */
        singleTokenHandler,
        //  <!-- --> ~= |= @charset .
        function(curToken) {
          curState.append(curToken);
          if (curState.text === "@charset ") {
            curState.production = "(charset)";
          }
        },
        //  Strings ' "
        function(curToken) {
          var stringType = curToken[0];
          curState.append(curToken);
          
          return function handler(curToken) {
            // Emit until we hit another one of ourselves, an unescaped newline
            if (curToken && (curToken[ESCAPED_NEWLINE] || !(/[\n\r\f]/.test(curToken[0])))) {
              var terminate = curState.value && curToken[0] === stringType;

              curState.append(curToken);

              if (terminate) {
                curState.production = "(string)";
              } else {
                return handler;
              }
            } else {
              curState.production = "(invalid)";
              return false;
            }
          };
        },
        // Starting Tokens -> match[15]
        function(curToken) {
          if (curToken[0] === "-") {
            // Ident
            curState.append(curToken);

            // nmStart
            return function(curToken) {
              if (!curToken)    return;

              if (curToken[NON_ASCII_ESCAPED] || !(/[^_a-z]/i.test(curToken[0]))) {
                curState.append(curToken);
                return nmCharHandler("(ident)");
              } else {
                // Not an ident character, just a floating "-";
                return false;
              }
            };
          } else if (curToken[0] === "#") {
            // {hash}
            curState.append(curToken);
            return nmCharHandler(function() { return curState.text !== "#" ? "(hash)" : undefined; });
          } else if (curToken[0] === "@") {
            curState.append(curToken);
            return nmCharHandler(function() { return AT_RULES[curState.value.toLowerCase()]; });
          } else if (curToken[0] === "!") {
            // ! important
            curState.append(curToken);

            return importantHandler;
          } else { // /[_a-z]/ -> nmstart
            // {ident}
            curState.append(curToken);
            return nmCharHandler("(ident)");
          }
        },
        // Catch All
        singleTokenHandler
    ];

    input.nextLine();
    
    function calcMatchType(match) {
      var matchType = match.length;
      while (matchType--) {
        if (match[matchType]) {
          return matchType;
        }
      }
    }

    var buffer = input.line,
        matchType;
    this.token = function() {
      if (!buffer) {
        return;
      }

      var match;
      while (buffer && (match = charMatcher.exec(buffer))) {
        if (curHandler) {
          curHandler = curHandler(match);
        } else {
          matchType = calcMatchType(match);
          if (matchType) {
            curHandler = handlers[matchType-1](match);
          } else {
            curHandler = undefined;
          }
        }

        if (!curHandler) {
          // Push the token back on the stack
          // TODO : We need some way to make sure that this was not the initial char or we will fail anyway
          if (curHandler === false) {
            var tokenLines = curState.text.split(/\r\n|\r|\n|\f/g);
            input.lineNum = curState.startCoord.line + tokenLines.length-1;
            charMatcher.lastIndex = (tokenLines.length===1 ? curState.startCoord.col : 0) + tokenLines[tokenLines.length-1].length;

            buffer = input.line;
          }
          var ret = curState;
          ret.endCoord = {line: input.lineNum, col: charMatcher.lastIndex-1};
        }

        if (charMatcher.lastIndex >= buffer.length) {
          if (input.nextLine()) {
            buffer = input.line;
            charMatcher.lastIndex = 0;
          } else {
            buffer = undefined;
          }
        }
        
        if (ret) {
          curState = new CssToken({line: input.lineNum, col: charMatcher.lastIndex});

          return ret;
        }
      }

      // Notify lookahead instances that we are done
      // TODO : Verify the safety of this
      if (curHandler) {
        curHandler(undefined);
      }

      if (curState.value) {
        curState.endCoord = {line: input.lineNum, col: charMatcher.lastIndex};
        return curState;
      }
    };
  };
})();
