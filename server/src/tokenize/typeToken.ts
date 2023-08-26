import { Literal } from "./literalToken"
import { ScriptReader } from "./reader"
import { TypeName } from "./typeNameToken"
import { TypeOperation } from "./typeOperationToken"

export namespace Type {
	export type Token = {
		tokenType: "type"
		token: Exclude<ReturnType<(typeof typeTokens)[number]["expect"]>, null | ScriptReader.SyntaxError>
		operation: TypeOperation.Token | null
	}

	export const typeTokens = [TypeName, Literal] as const

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const error = (error: ScriptReader.SyntaxError) => reader.syntaxError(`While expecting value:\n\t${error.message}`)

		const checkpoint = reader.checkpoint()
		let token: Token["token"] | null = null
		for (const typeToken of typeTokens) {
			checkpoint.restore()
			const resultToken = typeToken.expect(reader)
			if (!resultToken) continue
			if (resultToken instanceof ScriptReader.SyntaxError) return error(resultToken)

			token = resultToken
			break
		}
		if (token === null) return null

		const hadWhitespaceBeforeOperation = reader.expectWhitespace()

		const operation = TypeOperation.expect(reader)
		if (operation) {
			if (operation instanceof ScriptReader.SyntaxError) return error(operation)
			if (!hadWhitespaceBeforeOperation) return error(reader.syntaxError(`Expected whitespace before operator: "${operation.operator}"`))
			return {
				tokenType: "type",
				token,
				operation,
			} satisfies Token
		}

		return {
			tokenType: "type",
			token,
			operation: null,
		} satisfies Token
	}
}
