// This is the root of dependency tree of all tokens
// So in order import and load all tokens correctly, in the right order, we need to import this file before any other token files
import "./topLevelToken"

import { Block } from "./blockToken"
import { ScriptReader } from "./reader"

export function tokenize(script: string) {
	const reader = ScriptReader.create(script)
	return Block.expect(reader, true)
}
