import { tokenize } from "./tokenize"
import { ScriptReader } from "./tokenize/reader"

const script = `
    type Foo
`

const result = tokenize(script)
if (result instanceof ScriptReader.SyntaxError) {
	const line = script.substring(0, result.at).split("\n").length
	const column = script.substring(0, result.at).split("\n").pop()!.length
	console.error(`Syntax error at line ${line}, column ${column}:\n\t${result.message}`)
} else console.log(JSON.stringify(result, null, "\t"))
