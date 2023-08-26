import { tokenize } from "./tokenize"
import { ScriptReader } from "./tokenize/reader"

const script = `
    return 123
    export var a: i64 = 123
    type Foo = i64 | i32
    export type Bar = Foo | 123: i32
    
    {
        var a = 1 ; var b = 2
        var c = 3
    }

    var a = 1
    var b = 2
    var c = a + b
`

const result = tokenize(script)
if (result instanceof ScriptReader.SyntaxError) {
	const line = script.substring(0, result.at).split("\n").length
	const column = script.substring(0, result.at).split("\n").pop()!.length
	console.error(`Syntax error at line ${line}, column ${column}:\n\t${result.message}`)
} else console.log(JSON.stringify(result, null, "\t"))
