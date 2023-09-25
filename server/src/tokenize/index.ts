import { ExportToken } from "./exportToken"
import { FunctionCallToken } from "./functionCallToken"
import { LiteralNumberToken } from "./literalNumberToken"
import { MultipleToken } from "./multipleToken"
import { OneOfToken } from "./oneOfToken"
import { ScriptReader } from "./reader"
import { ReturnToken } from "./returnToken"
import { TypeDefinitionToken } from "./typeDefinitionToken"
import { TypeNameToken } from "./typeNameToken"
import { TypeTraitToken } from "./typeTraitToken"
import { ValueToken } from "./valueToken"
import { VariableDefinitionToken } from "./variableDefinitionToken"
import { VariableNameToken } from "./variableNameToken"

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
		tokenType(): T["tokenType"]
		expect(reader: ScriptReader): T | null | ScriptReader.SyntaxError
	}
	export type BuilderNoError<T extends Token> = {
		tokenType(): T["tokenType"]
		expect(reader: ScriptReader): T | null
	}
	export type BuilderNoNull<T extends Token> = {
		tokenType(): T["tokenType"]
		expect(reader: ScriptReader): T | ScriptReader.SyntaxError
	}

	export function is<T extends Token>(token: Token, builder: Token.Builder<T>): token is T {
		return token.tokenType === builder.tokenType()
	}
}

export function tokenize(script: string) {
	const reader = ScriptReader.create(script)
	const result = MultipleToken(RootLevelToken).expect(reader)
	if (!result) return []
	if (result instanceof ScriptReader.SyntaxError) return result
	return result.members
}

export type PrimitiveTypeToken = Token.Of<typeof PrimitiveTypeToken>
export const PrimitiveTypeToken = OneOfToken([TypeNameToken, LiteralNumberToken])

export type PrimitiveValueToken = Token.Of<typeof PrimitiveValueToken>
export const PrimitiveValueToken = OneOfToken([FunctionCallToken, LiteralNumberToken, VariableNameToken])

export type DefinitionToken = TypeDefinitionToken | VariableDefinitionToken
export const DefinitionToken: Token.Builder<DefinitionToken> = OneOfToken([TypeDefinitionToken, VariableDefinitionToken])

export type PrimitiveTopLevelToken = Token.Of<typeof PrimitiveTopLevelToken>
export const PrimitiveTopLevelToken = OneOfToken([ReturnToken, TypeTraitToken, DefinitionToken, ValueToken])

type RootLevelToken = Token.Of<typeof RootLevelToken>
const RootLevelToken = OneOfToken([ExportToken(DefinitionToken), PrimitiveTopLevelToken])
