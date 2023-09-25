import type { Token } from "."
import { BlockToken } from "./blockToken"
import { ExportToken } from "./exportToken"
import { KeywordToken } from "./keywordToken"
import { OneOfToken } from "./oneOfToken"
import { ScriptReader } from "./reader"
import { TupleToken } from "./tupleToken"
import { TypeNameToken } from "./typeNameToken"
import { TypeToken } from "./typeToken"
import { VariableDefinitionToken } from "./variableDefinitionToken"

const tokenType = "typeDefinition"
export type TypeDefinitionToken = Token<
	typeof tokenType,
	{
		keyword: KeywordToken<"type">
		name: TypeNameToken
		token:
			| TupleToken<TypeToken>
			| BlockToken<ExportToken<TypeDefinitionToken | VariableDefinitionToken> | TypeDefinitionToken | VariableDefinitionToken>
			| null
	}
>
export const TypeDefinitionToken: Token.Builder<TypeDefinitionToken> = {
	tokenType,
	is(value): value is TypeDefinitionToken {
		return value.tokenType === tokenType
	},
	expect(reader) {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting variable definition:\n\t${error.message}`)
		const startAt = reader.getIndex()

		const keyword = KeywordToken("type").expect(reader)
		if (!keyword) return null

		if (!reader.expectWhitespace()) return error(reader.syntaxError(`Expected whitespace after "${keyword.keyword}"`))

		const name = TypeNameToken.expect(reader)
		if (!name) return null
		if (name instanceof ScriptReader.SyntaxError) return error(name)

		const checkpointAfterName = reader.checkpoint()
		const hadWhitespaceAfterName = reader.expectWhitespace()

		const token = OneOfToken(() => [
			TupleToken(TypeToken),
			BlockToken(
				OneOfToken(() => [
					ExportToken(OneOfToken(() => [TypeDefinitionToken, VariableDefinitionToken])),
					OneOfToken(() => [TypeDefinitionToken, VariableDefinitionToken]),
				])
			),
		]).expect(reader)
		if (token instanceof ScriptReader.SyntaxError) return error(token)
		if (token && !hadWhitespaceAfterName) return error(reader.syntaxError(`Expected whitespace after "${name.name.word}"`))
		if (!token) checkpointAfterName.restore()

		return {
			tokenType,
			keyword,
			name,
			token,
			location: {
				startAt,
				endAt: reader.getIndex(),
			},
		}
	},
}
