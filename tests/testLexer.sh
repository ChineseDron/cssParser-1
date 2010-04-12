#! /bin/sh

if [[ ! -d $CSSPARSER_DIR ]]; then
  CSSPARSER_DIR=`dirname $0`/..
fi
if [[ ! -d $RHINO_DIR ]]; then
  RHINO_DIR=$CSSPARSER_DIR/lib
fi

java -cp $RHINO_DIR/js.jar org.mozilla.javascript.tools.shell.Main \
    -debug \
    -f $CSSPARSER_DIR/lineBuffer.js \
    -f $CSSPARSER_DIR/cssToken.js \
    -f $CSSPARSER_DIR/cssLex.js \
    $CSSPARSER_DIR/tests/testLexer.js \
    $@
