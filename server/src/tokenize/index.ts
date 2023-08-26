import "./topLevelToken" // This is the root of all tokens, so to be able to import and load all tokens correctly, we need to import it first

import { Block } from "./blockToken"
import { ScriptReader } from "./reader"

export function tokenize(script: string) {
	const reader = ScriptReader.create(script)
	return Block.expect(reader, true)
}
