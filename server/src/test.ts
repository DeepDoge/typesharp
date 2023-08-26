import { tokenize } from "./tokenize"
import { ScriptReader } from "./tokenize/reader"

const script = `
    var foo = 1.5 + 5
    var bar = 321
    var baz = foo + bar
    
    print(foo, 1 + 2, 3 + 4, 5 + beep())

    {
        var foo = 1
    }
`

const result = tokenize(script)
if (result instanceof ScriptReader.SyntaxError) {
	const line = script.substring(0, result.at).split("\n").length
	const column = script.substring(0, result.at).split("\n").pop()!.length
	console.error(`Syntax error at line ${line}, column ${column}:\n\t${result.message}`)
} else console.log(JSON.stringify(result, null, "\t"))
