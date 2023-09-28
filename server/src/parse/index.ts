import { Token, Tokens } from "../tokenize"

/*
 * The parser is responsible for parsing the tokens produced by the tokenizer.
 * Basically, it will create instructions for the compiler to follow.
 *
 * The parser will also do the type checking and semantic analysis.
 */
export namespace Parser {
	export class ParsingError extends Error {
		public token: Token
		constructor(token: Token, message: string) {
			super(message)
			this.token = token
		}
	}

	export type Context = {
		parent: Context | null
		values: Map<string, Context.Value>
		types: Map<string, Context.Type>
		instructions: Context.Instruction[]
	}
	export namespace Context {
		export function create(parent: Context | null): Context {
			return {
				parent,
				values: new Map(),
				types: new Map(),
				instructions: [],
			}
		}

		export type Type = {
			signature: string
		}

		export type Value = {
			type: Type
		}

		export namespace Instruction {
			export type Type = Instruction["type"]
		}
		export type Instruction =
			| {
					type: "define-value"
					name: string
			  }
			| {
					type: "set-value"
					name: string
					value: Value
			  }
	}

	export function parse(rootToken: Tokens.Root) {
		const rootContext = Context.create(null)
		rootToken.meta.tokens.forEach((token) => {
			if (Token.is(Tokens.TypeDefinition, token)) return parseTypeDefinition(rootContext, token)
			if (Token.is(Tokens.ValueDefinition, token)) return parseValueDefinition(rootContext, token)

			token satisfies never
		})
	}

	function parseTypeDefinition(context: Context, token: Tokens.TypeDefinition) {
		context.types.set(token.meta.name.meta.value, parseType(context, token.meta.type))
	}

	function parseType(context: Context, token: Tokens.Type): Context.Type {
		type _ = Token.DebugTokenType<typeof token>

		if (Token.is(Tokens.Name, token)) {
			const type = context.types.get(token.meta.value)
			if (!type) throw new ParsingError(token, `Type '${token.meta.value}' is not defined`)
			return type
		}
		if (Token.is(Tokens.StringLiteral, token)) return { signature: `"${token.meta.value}"` }
		if (Token.is(Tokens.NumberLiteral, token)) return { signature: `${token.meta.value}` }
		if (Token.is(Tokens.Tuple, token))
			return { signature: `(${token.meta.tokens.map((value) => parseType(context, value).signature).join(", ")})` }

		token satisfies never
		token.type satisfies never
	}

	function parseValueDefinition(context: Context, token: Tokens.ValueDefinition) {
		const value: Context.Value = {
			type: parseType(context, token.meta.type!.meta.right),
		}
		context.values.set(token.meta.name.meta.value, null)
	}
}
