export type ScriptReader = {
	checkpoint(): ScriptReader.Checkpoint
	skipWhitespace(ignoreNewlines?: boolean): void
	expectWhitespace(ignoreNewlines?: boolean): string | null
	expectWord(): string | null
	expectString(expected: string): string | null
	expectEndOfLine(): string | null

	next(): string | null
	peek(): string | null

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
				return script[index++]
			},
			peek() {
				if (index >= script.length) return null
				return script[index]
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
			expectWord() {
				// word starts with a letter, underscore, or dollar sign, and is followed by any number of letters, underscores, dollar signs, or numbers
				const char = self.peek()
				if (!char) return null
				if (!/^[a-zA-Z_$]$/.test(char)) return null
				let word = ""
				while (true) {
					const char = self.peek()
					if (!char) break
					if (!/^[a-zA-Z0-9_$]$/.test(char)) break
					word += self.next()
				}
				return word
			},
			expectString(expected: string) {
				for (const char of expected) {
					if (self.peek() !== char) return null
					self.next()
				}
				return expected
			},
			expectEndOfLine() {
				self.skipWhitespace(true)
				if (index === script.length - 1) return "\0"
				if (script[index] === "\n") return "\n"
				if (script[index] === "\r") return "\n"
				if (script[index] === "\0") return "\0"
				if (script[index] === ";") return ";"
				return null
			},
		}

		return self
	}
}
