import { BlockToken } from "./blockToken"
import { ExportToken } from "./exportToken"
import { MultipleToken } from "./multipleToken"
import { OneOfToken } from "./oneOfToken"
import { ScriptReader } from "./reader"
import { ReturnToken } from "./returnToken"
import { TypeDefinitionToken } from "./typeDefinitionToken"
import { TypeTraitToken } from "./typeTraitToken"
import { ValueToken } from "./valueToken"
import { VariableDefinitionToken } from "./variableDefinitionToken"

export type Token<TName extends string = string, T = { [key: PropertyKey]: unknown }> = T & {
	tokenType: TName
	location: Token.Location
}
export namespace Token {
	export type Location = {
		startAt: number
		endAt: number
	}
	export type Of<T extends Token.Builder<Token>> = T extends Token.Builder<infer U> ? U : never
	export type Builder<T extends Token> = {
		tokenType: T["tokenType"]
		is(value: Token): value is T
		expect(reader: ScriptReader): T | null | ScriptReader.SyntaxError
	}
	export type BuilderOptional<T extends Token> = {
		tokenType: T["tokenType"]
		is(value: Token): value is T
		expect(reader: ScriptReader): T | null
	}
}

type Tokens = Token.Of<(typeof tokensBase)[number]> | Token<"block", { members: Tokens[] }>
const tokensBase = [
	ExportToken(OneOfToken(() => [VariableDefinitionToken, TypeDefinitionToken])),
	ReturnToken,
	TypeTraitToken,
	TypeDefinitionToken,
	VariableDefinitionToken,
	ValueToken,
] as const
const tokens: Token.Builder<Tokens>[] = [...tokensBase, BlockToken(OneOfToken(() => tokens))]

export function tokenize(script: string) {
	const reader = ScriptReader.create(script)
	const result = MultipleToken(OneOfToken(() => tokens)).expect(reader)
	if (!result) return []
	if (result instanceof ScriptReader.SyntaxError) return result
	return result.members
}
