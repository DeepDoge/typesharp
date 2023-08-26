import { Block } from "./blockToken"
import { Export } from "./exportToken"
import { ScriptReader } from "./reader"
import { Return } from "./returnToken"
import { TypeDefinition } from "./typeDefinitionToken"
import { Type } from "./typeToken"
import { Value } from "./valueToken"
import { VariableDefinition } from "./variableDefinitionToken"

export namespace TopLevelToken {
	export type Token = Exclude<ReturnType<(typeof tokens)[number]["expect"]>, null | ScriptReader.SyntaxError>
	export const tokens = [Block, Return, Export, VariableDefinition, TypeDefinition, Type, Value] as const

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
