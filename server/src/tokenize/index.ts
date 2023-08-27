// This is the root of dependency tree of all tokens
// So in order import and load all tokens correctly, in the right order, we need to import this file before any other token files
import "./topLevelToken"

import { Block } from "./blockToken"
import { ScriptReader } from "./reader"

export type Token<TName extends string = string, T = { [key: PropertyKey]: unknown }> = T & {
	tokenType: TName
	location: Token.Location
}
export namespace Token {
	export type Location = {
		startAt: number
		endAt: number
	}
}

export function tokenize(script: string) {
	const reader = ScriptReader.create(script)
	const result = Block.expect(reader, true)
	if (!result) return []
	if (result instanceof ScriptReader.SyntaxError) return result
	return result.tokens
}
