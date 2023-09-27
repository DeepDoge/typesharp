import { Token } from "./tokenize"
import { ScriptReader } from "./tokenize/reader"

const script = `
var foo = 123: i64
type Foo ()
type Bar (123)
type Baz (i64)
type Qux ({
    pub var hello = 123: i64

    pub type X (i64)
    pub type Y (i64)
    pub type Z (i64)
})

var ONE: Self = 1

type trait Number {
    pub var ZERO: Self = 0
    pub var ONE: Self = 1
}

{
    pub var foo = 123: i64
}

var pub = 69: i128

var a = {
    type Foo ()
    type Bar (123)

    pub var x = 123: i64
}

`

const result = Token.tokenizeScript(script)
if (result instanceof ScriptReader.SyntaxError) {
	const line = script.substring(0, result.at).split("\n").length
	const column = script.substring(0, result.at).split("\n").pop()!.length
	console.error(`Syntax error at line ${line}, column ${column}:\n\t${result.message}`)
} else console.log(JSON.stringify(result, null, "\t"))
