// TODO : Test Each of the productions
(function() {
  function testTokens(tokens) {
    var builder = [],
        len = tokens.length;
    for (var i = 0; i < len; i++) {
      builder.push(tokens[i].text);
    }

    var concatLexer = new cssLex(new LineBuffer(builder.join(""))),
        tokenCount = 0,
        cur,
        startLine = 1, startCol = -1,
        endLine = 1, endCol = -1,
        ret = [];
    while (cur = concatLexer.token()) {
      var curToken = tokens[tokenCount] || {},
          tokenLines = curToken.text.split(/\r\n|\r|\n|\f/g),
          value = curToken.value || curToken.text;

      ret.push(cur);

      startLine = endLine;
      startCol = endCol+1;
      endLine += tokenLines.length-1;
      endCol = (tokenLines.length===1 ? startCol : 0) + tokenLines[tokenLines.length-1].length-1;

      if (curToken.text !== cur.text) {
        print("Match text failed for index", tokenCount, "expected '" + curToken.text.replace(/ /g, "_") + "' actual '" + cur.text.replace(/ /g, "_") + "'");
      }
      if (value !== cur.value) {
        print("Match value failed for index", cur.text, "expected '" + value+ "' actual '" + cur.value + "'");
      }
      if (curToken.production !== cur.production) {
        print("Production failed for index", cur.text, "expected '" + curToken.production + "' actual '" + cur.production + "'");
      }
      if (startLine !== cur.startCoord.line) {
        print("Match startLine failed for index", cur.text, "expected '" + startLine + "' actual '" + cur.startCoord.line + "'");
      }
      if (startCol !== cur.startCoord.col) {
        print("Match startCol failed for index", cur.text, "expected '" + startCol + "' actual '" + cur.startCoord.col + "'");
      }
      if (endLine !== cur.endCoord.line) {
        print("Match endLine failed for index", cur.text, "expected '" + endLine + "' actual '" + cur.endCoord.line + "'");
      }
      if (endCol !== cur.endCoord.col) {
        print("Match endCol failed for index", cur.text, "expected '" + endCol + "' actual '" + cur.endCoord.col + "'");
      }

      tokenCount++;
    }

    if (tokenCount !== tokens.length) {
      print("Lenth failed: actualLen:", tokenCount, "retLen:", tokens.length, "ret:", ret);
    }

    for (var i = 0; i < len; i++) {
      
    }
  }

//    var input = "\uff48\n\\ff48\n\\a\\g\\\n\r\n0 0.1 .1 /*te st*/<!--Test-->~=|=@charset@charset \"We're\" 'really\"\\\n cooking' with gas now",
  testTokens([
      { text: "    \n ", production: "(whitespace)" },
      { text: "/*Test \n Test*/", production: "(comment)" },
      { text: "<!--" },
      { text: "-" },
      { text: "-->" },
      { text: "~=" },
      { text: "|" },
      { text: "|=" },
      { text: "\"str\\i'n\\0000202gs\\\nwwooo\"", value: "\"stri'n 2gs\nwwooo\"", production: "(string)" },
      { text: "\'str\\i\"n\\0000202gs\\\nwwooo\'", value: "\'stri\"n 2gs\nwwooo\'", production: "(string)" },
      { text: "\"str\\i'n\\0000202gs", value: "\"stri'n 2gs", production: "(invalid)" },
      { text: "\n", production: "(whitespace)" },
      { text: "\'str\\i\"n\\0000202gs", value: "\'stri\"n 2gs", production: "(invalid)" },
      { text: "\n", production: "(whitespace)" },
      { text: "@import", production: "(import)" },
      { text: "@IMPORT", production: "(import)" },
      { text: "@\\Im\\00050\r\n\\06f rt", value: "@ImPort", production: "(import)" },
      { text: "@page", production: "(page)" },
      { text: "@P\\000041\t\\gE", value: "@PAgE", production: "(page)" },
      { text: "@media", production: "(media)" },
      { text: "@M\\000065\rd\\i\\41\n", value: "@MediA", production: "(media)" },
      { text: "@me\\dia", value: "@me\ria" },
      { text: "@charset ", production: "(charset)" },
      { text: "@charset" },
      { text: "@Charset" },
      { text: " \n", production: "(whitespace)" },

      { text: "12", production: "(number)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2", production: "(number)" },
      { text: " ", production: "(whitespace)" },
      { text: "1%", production: "(percentage)" },
      { text: "2", production: "(number)" },
      { text: "\n", production: "(whitespace)" },

      { text: "1.2em", production: "(ems)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2e\\M", value: "1.2eM", production: "(ems)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2em", production: "(ems)" },
      { text: "x", production: "(ident)" },
      { text: "\n", production: "(whitespace)" },

      { text: "1.2ex", production: "(exs)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2E\\000078", value: "1.2Ex", production: "(exs)" },
      { text: "1.2ex", production: "(exs)" },
      { text: "x", production: "(ident)" },
      { text: "\n", production: "(whitespace)" },

      { text: "1.2px", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2\\pX", value: "1.2pX", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2px", production: "(length)" },
      { text: "x", production: "(ident)" },
      { text: "\n", production: "(whitespace)" },

      { text: "1.2cm", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2c\\M", value: "1.2cM", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2cm", production: "(length)" },
      { text: "x", production: "(ident)" },
      { text: "\n", production: "(whitespace)" },

      { text: "1.2mm", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2\\mM", value: "1.2mM", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2mm", production: "(length)" },
      { text: "x", production: "(ident)" },
      { text: "\n", production: "(whitespace)" },

      { text: "1.2in", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2\\iN", value: "1.2iN", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2in", production: "(length)" },
      { text: "x", production: "(ident)" },
      { text: "\n", production: "(whitespace)" },

      { text: "1.2pt", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2\\pt", value: "1.2pt", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2pt", production: "(length)" },
      { text: "x", production: "(ident)" },
      { text: "\n", production: "(whitespace)" },

      { text: "1.2pc", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2\\pc", value: "1.2pc", production: "(length)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2pc", production: "(length)" },
      { text: "x", production: "(ident)" },
      { text: "\n", production: "(whitespace)" },

      { text: "1.2deg", production: "(angle)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2deg", production: "(angle)" },
      { text: "x", production: "(ident)" },
      { text: "1.2rad", production: "(angle)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2rad", production: "(angle)" },
      { text: "x", production: "(ident)" },
      { text: "1.2grad", production: "(angle)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2grad", production: "(angle)" },
      { text: "x", production: "(ident)" },

      { text: "1.2s", production: "(time)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2ms", production: "(time)" },
      { text: "x", production: "(ident)" },
      { text: "1.2hz", production: "(freq)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2kHz", production: "(freq)" },
      { text: "x", production: "(ident)" },

      { text: "1.2boom", production: "(dimension)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2-boom123", production: "(dimension)" },
      { text: " ", production: "(whitespace)" },
      { text: "1.2\\35mx", value: "1.25mx", production: "(dimension)" },
      { text: " ", production: "(whitespace)" },

      { text: "ident123abc", production: "(ident)" },
      { text: " ", production: "(whitespace)" },
      { text: "\\35ident", value: "5ident", production: "(ident)" },
      { text: " ", production: "(whitespace)" },
      { text: "-" },
      { text: "-ide-nt123", production: "(ident)" },
      { text: " ", production: "(whitespace)" },

      { text: "ident123abc(", production: "(function)" },
      { text: "\\35ident(", value: "5ident(", production: "(function)" },
      { text: "-" },
      { text: "-ide-nt123(", production: "(function)" },

      { text: "#ident123abc", production: "(hash)" },
      { text: "#\\35ident", value: "#5ident", production: "(hash)" },
      { text: "#-", production: "(hash)" },
      { text: "(" },
      { text: "#" },
      { text: "#-ide-nt123", production: "(hash)" },

      { text: "!    /* Important ! */ \n/*!*/ iMpor\\t\\41 nt", value: "!    /* Important ! */ \n/*!*/ iMportAnt", production: "(important)" },
      { text: "!" },
      { text: "    \n ", production: "(whitespace)" },
      { text: "/*Test \n Test*/", production: "(comment)" },
      { text: "impooortant", production: "(ident)" },
      { text: "    ", production: "(whitespace)" },

      { text: "UrL(    \"value\"    )", production: "(url)" },
      { text: "Ur\\L()", value: "UrL()", production: "(url)" },
      { text: "UrL(", production: "(function)" },
      { text: "    ", production: "(whitespace)" },
      { text: "/* URL */", production: "(comment)" },
      { text: "\"value\"", production: "(string)" },
      { text: ")" },
      { text: "UrL(", production: "(function)" },
      { text: "    ", production: "(whitespace)" },
      { text: "\"value", production: "(invalid)" },
      { text: "\n", production: "(whitespace)" },
      { text: ")" },
      { text: "UrL(  !#$%&*-~\\35  )", value: "UrL(  !#$%&*-~5 )", production: "(url)" },
      { text: "{" },
      { text: "}" },
      { text: "(" },
      { text: ")" },
      { text: "%" },
      { text: "$" },
  ]);
  // TODO : Include tests where each production is at the end
  // TODO : Include tests where each production falls off the end (i.e. is incomple)
})();
