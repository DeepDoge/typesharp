import type { Token } from "."
import { DefinitionToken } from "."
import { BlockToken } from "./blockToken"
import { ExportToken } from "./exportToken"
import { KeywordToken } from "./keywordToken"
import { OneOfToken } from "./oneOfToken"
import { ScriptReader } from "./reader"
import { TupleToken } from "./tupleToken"
import { TypeNameToken } from "./typeNameToken"
import { TypeToken } from "./typeToken"

type $Token = TupleToken<TypeToken> | BlockToken<ExportToken<DefinitionToken> | DefinitionToken>
const $Token: Token.Builder<$Token> = OneOfToken(() => [
	TupleToken(TypeToken),
	BlockToken(OneOfToken([ExportToken(DefinitionToken), DefinitionToken])),
])

const tokenType = "typeDefinition"
export type TypeDefinitionToken = Token<
	typeof tokenType,
	{
		keyword: KeywordToken<"type">
		name: TypeNameToken
		token: $Token | null
	}
>
export const TypeDefinitionToken: Token.Builder<TypeDefinitionToken> = {
	tokenType() {
		return tokenType
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

		const token = $Token.expect(reader)
		if (token instanceof ScriptReader.SyntaxError) return error(token)
		if (token && !hadWhitespaceAfterName) return error(reader.syntaxError(`Expected whitespace after "${name.name.word}"`))
		if (!token) checkpointAfterName.restore()

		return {
			tokenType: this.tokenType(),
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
