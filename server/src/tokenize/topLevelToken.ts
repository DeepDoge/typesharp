import { Block } from "./blockToken"
import { ScriptReader } from "./reader"
import { Value } from "./valueToken"
import { VariableDefinition } from "./variableDefinitionToken"

export namespace TopLevelToken {
	export type Token = Exclude<ReturnType<(typeof tokens)[number]["expect"]>, null | ScriptReader.SyntaxError>
	export const tokens = [VariableDefinition, Value, Block] as const

	export function expect(reader: ScriptReader): Token | ScriptReader.SyntaxError | null {
		const checkpoint = reader.checkpoint()
		for (const token of tokens) {
			checkpoint.restore()
			const resultToken = token.expect(reader)
			if (resultToken) {
				if (resultToken instanceof ScriptReader.SyntaxError) return resultToken
				return resultToken
			}
		}
		return null
	}
}
