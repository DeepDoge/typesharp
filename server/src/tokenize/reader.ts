export type ScriptReader = {
	checkpoint(): ScriptReader.Checkpoint
	skipWhitespace(ignoreNewlines?: boolean): void
	expectWhitespace(ignoreNewlines?: boolean): string | ScriptReader.NotError
	expectWord(): string | ScriptReader.NotError
	expect(expected: string): string | ScriptReader.NotError
	expectEndOfLine(): string | ScriptReader.NotError

	hasMore(): boolean
	next(): string
	peek(): string
}
export namespace ScriptReader {
	export type Checkpoint = {
		restore(): void
	}

	export class NotError extends Error {}

	export function create(script: string): ScriptReader {
		let index = 0
		const self: ScriptReader = {
			checkpoint() {
				const checkpointIndex = index
				return {
					restore() {
						index = checkpointIndex
					},
				}
			},
			hasMore() {
				return index < script.length
			},
			next() {
				let char = script[index]
				if (this.hasMore()) index++
				return char
			},
			peek() {
				return script[index]
			},
			skipWhitespace(ignoreNewlines = false) {
				while (index < script.length && /\s/.test(script[index])) {
					if (ignoreNewlines && script[index] === "\n") break
					index++
				}
			},
			expectWhitespace(ignoreNewlines = false) {
				const char = this.next()
				if (/^\s$/.test(char)) {
					this.skipWhitespace(ignoreNewlines)
					return char
				}
				return new ScriptReader.NotError(`Expected whitespace`)
			},
			expectWord() {
				let word = ""
				while (index < script.length && /[a-zA-Z0-9_]/.test(script[index])) {
					word += script[index]
					index++
				}
				if (word === "") return new ScriptReader.NotError(`Expected a word`)
				return word
			},
			expect(expected: string) {
				let index = 0
				while (index < script.length && index < expected.length) {
					if (script[index] !== expected[index]) return new ScriptReader.NotError(`Expected ${expected}`)
					index++
					index++
				}
				if (index < expected.length) return new ScriptReader.NotError(`Expected ${expected}`)
				return expected
			},
			expectEndOfLine() {
				this.skipWhitespace(true)
				if (index === script.length - 1) return "\0"
				if (script[index] === "\n") return "\n"
				if (script[index] === "\r") return "\n"
				if (script[index] === "\0") return "\0"
				if (script[index] === ";") return ";"
				return new ScriptReader.NotError(`Expected end of line`)
			},
		}

		return self
	}
}
