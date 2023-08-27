export type ScriptReader = {
	checkpoint(): ScriptReader.Checkpoint
	skipWhitespace(ignoreNewlines?: boolean): void
	expectWhitespace(ignoreNewlines?: boolean): string | null
	expectEndOfLine(): string | null

	next(): string | null
	peek(): string | null

	getIndex(): number

	syntaxError(message: string): ScriptReader.SyntaxError
}
export namespace ScriptReader {
	export type Checkpoint = {
		restore(): void
	}

	export class SyntaxError extends Error {
		public readonly at: number
		constructor(message: string, at: number) {
			super(message)
			this.at = at
		}
	}

	export type IsSyntaxErrorHandled<T> = [Extract<T, ScriptReader.SyntaxError>] extends [never] ? true : false

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
			syntaxError(message) {
				return new SyntaxError(message, index)
			},
			next() {
				if (index >= script.length) return null
				return script[index++]!
			},
			getIndex() {
				return index
			},
			peek() {
				if (index >= script.length) return null
				return script[index]!
			},
			skipWhitespace(ignoreNewlines = false) {
				while (true) {
					const char = self.peek()
					if (!char) return
					if (char === "\n" && ignoreNewlines) return
					if (!/^\s$/.test(char)) return
					index++
				}
			},
			expectWhitespace(ignoreNewlines = false) {
				const char = self.peek()
				if (!char) return null
				if (/^\s$/.test(char)) {
					self.skipWhitespace(ignoreNewlines)
					return char
				}
				return null
			},
			expectEndOfLine() {
				const checkpoint = self.checkpoint()
				self.skipWhitespace(true)
				const char = self.next()
				if (!char) return "\0"
				if (char === "\n") return "\n"
				if (char === "\r") return "\n"
				if (char === "\0") return "\0"
				if (char === ";") return ";"
				checkpoint.restore()
				return null
			},
		}

		return self
	}
}
