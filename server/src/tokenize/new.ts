import { ScriptReader } from "./reader"

export interface Token<T extends string = string, TMeta extends object = {}> {
	type: T
	location: Token.Location
	meta: TMeta
}
export namespace Token {
	export type Location = {
		startAt: number
		endAt: number
	}
	export const SyntaxError = ScriptReader.SyntaxError
	export type SyntaxError = ScriptReader.SyntaxError

	export type Of<T extends Expector.Factory<Token> | Expector<Token>> = T extends Expector<infer U>
		? U
		: T extends Expector.Factory<infer U>
		? U
		: never

	const tokenWeakMap = new WeakMap<Token, unknown>()
	export function is<T extends Token>(token: Token, builderOrFactory: Expector<T> | Expector.Factory<T>): token is T {
		if (typeof builderOrFactory === "function") return tokenWeakMap.get(token) === builderOrFactory
		return token.type === builderOrFactory.type
	}

	export type Expector<T extends Token = Token> = {
		type: T["type"]
		expect: (reader: ScriptReader) => T | SyntaxError | null
	}
	export namespace Expector {
		export type Factory<T extends Token> = (...args: any[]) => Expector<T>

		export function create<const T extends string, const TMeta extends object>(
			type: T,
			key: unknown,
			build: (reader: ScriptReader) => TMeta | SyntaxError | null
		) {
			const selfExpector: Expector<Token<T, TMeta>> = {
				type,
				expect(reader) {
					const startAt = reader.getIndex()
					const checkPoint = reader.checkpoint()
					const result = build(reader)
					const endAt = reader.getIndex()
					if (!result) return checkPoint.restore(), null
					if (result instanceof SyntaxError) return result
					const selfToken: Token<T, TMeta> = {
						meta: result,
						type,
						location: {
							startAt,
							endAt,
						},
					}
					tokenWeakMap.set(selfToken, key)
					return selfToken
				},
			}

			return selfExpector
		}
	}

	export namespace Tokens {
		function nullOrError(token: Token | SyntaxError | null): token is SyntaxError | null {
			return token instanceof SyntaxError || token === null
		}

		namespace OneOfHelpers {
			type ReplaceTupleRecursively<T, TFind, TReplace> = T extends readonly [infer U, ...infer V]
				? readonly [ReplaceRecursively<U, TFind, [TReplace]>, ...ReplaceTupleRecursively<V, TFind, TReplace>]
				: T extends readonly (infer U)[]
				? readonly ReplaceRecursively<U, TFind, [TReplace]>[]
				: T

			type ReplaceRecursively<T, TFind, TReplace extends [unknown]> = T extends TFind
				? TReplace[0]
				: T extends object
				? { [K in keyof T]: ReplaceRecursively<T[K], TFind, TReplace> }
				: T extends any[] | readonly any[]
				? ReplaceTupleRecursively<T, TFind, TReplace[0]>
				: T

			export const replaceRecursivelyInplace = ((value: unknown, find: unknown, replace: unknown): unknown => {
				if (value === find) return replace
				if (typeof value !== "object") return value
				if (value === null) return value
				if (Array.isArray(value)) for (let i = 0; i < value.length; i++) value[i] = replaceRecursivelyInplace(value[i], find, replace)
				else for (const key in value) (value as any)[key] = replaceRecursivelyInplace((value as any)[key], find, replace)
				return value
			}) as {
				<T, TFind, TReplace>(value: T, find: TFind, replace: TReplace): ReplaceRecursively<T, TFind, [TReplace]>
			}

			export const SELF = Token.Expector.create(`...` as const, null, () => ({}))
			export type SELF = Token.Of<typeof SELF>

			function OneOfFnWithRecursiveSelfHelper<const TExpector extends Token.Expector>(
				expectors: (SELF: Token.Expector<OneOfHelpers.SELF>) => readonly TExpector[]
			) {
				type T = ReplaceRecursively<Token.Of<TExpector>, OneOfHelpers.SELF, [T]>
				expectors
				return null as unknown as Token.Expector<T>
			}
			export type OneOfFnWithRecursiveSelf = typeof OneOfFnWithRecursiveSelfHelper
		}

		export const OneOf: OneOfHelpers.OneOfFnWithRecursiveSelf & {
			<const TExpector extends Token.Expector>(expectors: readonly TExpector[]): TExpector
		} = (expectors: readonly Token.Expector[] | ((SELF: Token.Expector<OneOfHelpers.SELF>) => readonly Token.Expector[])): never => {
			const [arr, shouldReplace] = typeof expectors === "function" ? [expectors(OneOfHelpers.SELF), true] : [expectors, false]

			const selfExpector: Token.Expector = {
				type: arr.map((expector) => expector.type).join(" | "),
				expect(reader: ScriptReader) {
					for (const expector of arr) {
						const self = expector.expect(reader)
						if (!self) continue
						if (self instanceof SyntaxError) return self
						return shouldReplace ? OneOfHelpers.replaceRecursivelyInplace(self, OneOfHelpers.SELF, self) : self
					}
					return null
				},
			}
			return selfExpector as never
		}

		export function Whitespace<const T1 extends "inline" | "full">(mode1: T1) {
			return Token.Expector.create(`whitespace(${mode1})`, Whitespace, (reader) => {
				const whitespace = reader.expectWhitespace(mode1 === "inline")
				if (!whitespace) return null
				return {}
			})
		}

		export function EndOfLine() {
			return Token.Expector.create("end-of-line", EndOfLine, (reader) => {
				const endOfLine = reader.expectEndOfLine()
				if (!endOfLine) null
				return {}
			})
		}

		export function Word() {
			return Token.Expector.create("word", Word, (reader) => {
				const firstChar = reader.peek()
				if (!firstChar) return null
				if (/[0-9]/.test(firstChar)) return null

				let value = ""
				while (true) {
					const char = reader.peek()
					if (!char) break
					if (!/[0-9a-zA-Z_$]/.test(char)) break
					value += char
					reader.next()
				}
				if (!value) return null
				return {
					value,
				}
			})
		}

		export function Keyword<const TKeyword extends string>(keyword: TKeyword) {
			return Token.Expector.create(`keyword(${keyword})`, Keyword, (reader) => {
				const word = Word().expect(reader)
				if (nullOrError(word)) return word
				if (word.meta.value !== keyword) return null

				return { word }
			})
		}

		export function Symbol<const TSymbol extends string>(symbol: TSymbol) {
			return Token.Expector.create(`symbol(${symbol})`, Symbol, (reader) => {
				const word = Word().expect(reader)
				if (nullOrError(word)) return word
				if (word.meta.value !== symbol) return null

				return { word }
			})
		}

		export function Operation<const TLeft extends Token, const TOperator extends string, const TRight extends Token>(
			leftExpector: Token.Expector<TLeft>,
			operatorString: TOperator,
			rightExpector: Token.Expector<TRight>
		) {
			return Token.Expector.create(`operation(${leftExpector.type} ${operatorString} ${rightExpector.type})`, Operation, (reader) => {
				const left = leftExpector.expect(reader)
				if (nullOrError(left)) return left

				Whitespace("full").expect(reader)

				const operator = Symbol(operatorString).expect(reader)
				if (nullOrError(operator)) return operator

				Whitespace("full").expect(reader)

				const right = rightExpector.expect(reader)
				if (!right) return reader.syntaxError("Expected right operand")
				if (right instanceof SyntaxError) return right

				return {
					left,
					operator,
					right,
				}
			})
		}

		export function NumberLiteral() {
			return Token.Expector.create("number", NumberLiteral, (reader) => {
				const firstChar = reader.peek()
				if (!firstChar) return null
				if (!/[0-9]/.test(firstChar)) return null

				let value = ""
				while (true) {
					const char = reader.peek()
					if (!char) break
					if (!/[0-9]/.test(char)) break
					value += char
					reader.next()
				}
				if (!value) return null
				return {
					value: Number(value),
				}
			})
		}

		export function StringLiteral() {
			return Token.Expector.create("string", StringLiteral, (reader) => {
				const firstChar = reader.peek()
				if (!firstChar) return null
				if (firstChar !== '"') return null

				let value = ""
				reader.next()
				let escape = false
				while (true) {
					const char = reader.next()
					if (!char) return reader.syntaxError("Expected closing quote")
					if (escape) {
						value += JSON.parse(`"\\${char}"`)
						escape = false
						continue
					}
					if (char === '"') break
					if (char === "\\") {
						escape = true
						continue
					}
					value += char
				}
				return {
					value,
				}
			})
		}

		export function BooleanLiteral() {
			return Token.Expector.create("boolean", BooleanLiteral, (reader) => {
				const keyword = OneOf([Keyword("true"), Keyword("false")]).expect(reader)
				if (nullOrError(keyword)) return keyword
				keyword.type
				return {
					keyword,
				}
			})
		}

		export function Tuple<const T extends Token>(expector: Token.Expector<T>) {
			return Token.Expector.create(`tuple(${expector.type})`, Tuple, (reader) => {
				const open = Symbol("(").expect(reader)
				if (nullOrError(open)) return open

				const tokens: T[] = []
				while (true) {
					const token = expector.expect(reader)
					if (!token) break
					if (token instanceof SyntaxError) return token
					tokens.push(token)
					const comma = Symbol(",").expect(reader)
					if (!comma) break
					if (comma instanceof SyntaxError) return comma
					Whitespace("full").expect(reader)
				}

				const close = Symbol(")").expect(reader)
				if (!close) return reader.syntaxError("Expected closing parenthesis")
				if (close instanceof SyntaxError) return close

				return {
					open,
					tokens,
					close,
				}
			})
		}

		export function Export<const T extends Token>(expector: Token.Expector<T>) {
			return Token.Expector.create(`export(${expector.type})`, Export, (reader) => {
				const keyword = Keyword("pub").expect(reader)
				if (nullOrError(keyword)) return keyword

				if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

				const token = expector.expect(reader)
				if (nullOrError(token)) return token

				return {
					keyword,
					token,
				}
			})
		}

		export function Name<const T extends "type" | "value">(type: T) {
			return Token.Expector.create(`name(${type})`, Name, (reader) => {
				const word = Word().expect(reader)
				if (nullOrError(word)) return word
				return { word }
			})
		}

		export function Nothing() {
			return Token.Expector.create(`nothing`, Nothing, (reader) => {
				Whitespace("full").expect(reader)
				return {}
			})
		}

		export function ValueDefinition() {
			return Token.Expector.create(`value-definition`, ValueDefinition, (reader) => {
				const keyword = Keyword("var").expect(reader)
				if (nullOrError(keyword)) return keyword

				if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

				const name = OneOf([Operation(Name("value"), ":", Type), Name("value")]).expect(reader)
				if (nullOrError(name)) return name

				const equals = Operation(Whitespace("inline"), "=", Value).expect(reader)
				if (equals instanceof SyntaxError) return equals

				return {
					keyword,
					name,
					equals,
				}
			})
		}

		export function TypeDefinition() {
			return Token.Expector.create(`type-definition`, TypeDefinition, (reader) => {
				const keyword = Keyword("type").expect(reader)
				if (nullOrError(keyword)) return keyword

				if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${keyword.type}`)

				const name = Name("type").expect(reader)
				if (nullOrError(name)) return name

				if (!Whitespace("inline").expect(reader)) return reader.syntaxError(`Expected whitespace after ${name.type}`)

				const type = OneOf([Tuple(Type)])

				return {
					keyword,
					name,
					type,
				}
			})
		}

		export function Multiline<const T extends Token>(expector: Token.Expector<T>) {
			return Token.Expector.create(`multiline(${expector.type})`, Multiline, (reader) => {
				const tokens: T[] = []
				while (true) {
					Whitespace("full").expect(reader)
					const token = expector.expect(reader)
					if (!token) break
					if (token instanceof SyntaxError) return token
					tokens.push(token)
					const endOfLine = EndOfLine().expect(reader)
					if (nullOrError(endOfLine)) return reader.syntaxError(`Expected end of line after ${token.type}`)
				}

				return { tokens }
			})
		}

		export function Block<const T extends Token>(expector: Token.Expector<T>) {
			return Token.Expector.create(`block(${expector.type})`, Block, (reader) => {
				const open = Symbol("{").expect(reader)
				if (nullOrError(open)) return open

				const multiline = Multiline(expector).expect(reader)
				if (multiline instanceof SyntaxError) return multiline

				const close = Symbol("}").expect(reader)
				if (!close) return reader.syntaxError("Expected closing brace")
				if (close instanceof SyntaxError) return close

				return {
					open,
					multiline,
					close,
				}
			})
		}

		export const Type = OneOf((SELF) => [Literal, Tuple(SELF), Block(SELF), Name("type")])
		export const Literal = OneOf([NumberLiteral(), StringLiteral(), BooleanLiteral()])

		export const ValueBlockMember = OneOf((SELF) => [Literal, Export(ValueDefinition()), Tuple(SELF), Block(SELF)])
		export const Value = OneOf((SELF) => [Literal, Tuple(SELF), Block(ValueBlockMember)])
	}
}
