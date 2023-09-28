import "./tokenize"

import type {
	CompletionItem,
	Diagnostic,
	InitializeParams,
	InitializeResult,
	SemanticTokens,
	TextDocumentPositionParams,
} from "vscode-languageserver/node"
import {
	CompletionItemKind,
	DiagnosticSeverity,
	ProposedFeatures,
	SemanticTokenModifiers,
	SemanticTokenTypes,
	SemanticTokensRegistrationType,
	SemanticTokensRequest,
	TextDocumentSyncKind,
	TextDocuments,
	createConnection,
} from "vscode-languageserver/node"

import { TextDocument } from "vscode-languageserver-textdocument"
import { Token, Tokens } from "./tokenize"
import { ScriptReader } from "./tokenize/reader"

const connection = createConnection(ProposedFeatures.all)
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

let hasWorkspaceFolderCapability = false

connection.onInitialize((params: InitializeParams) => {
	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true,
			},
		},
	}
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true,
			},
		}
	}
	return result
})

const tokenTypes = Object.values(SemanticTokenTypes)
const tokenTypeToIndexMap = new Map(tokenTypes.map((value, index) => [value, index]))
const tokenModifiers = Object.values(SemanticTokenModifiers)
const tokenModifierToIndexMap = new Map(tokenModifiers.map((value, index) => [value, index]))
function createSemanticToken(
	line: number,
	char: number,
	length: number,
	tokenType: keyof typeof SemanticTokenTypes,
	tokenModifier: keyof typeof SemanticTokenModifiers
): number[] {
	const tokenTypeIndex = tokenTypeToIndexMap.get(SemanticTokenTypes[tokenType])!
	const tokenModifierIndex = tokenModifierToIndexMap.get(SemanticTokenModifiers[tokenModifier])!
	return [line, char, length, tokenTypeIndex, 0]
}

connection.onInitialized(() => {
	connection.client.register(SemanticTokensRegistrationType.type, {
		documentSelector: [{ language: "bull-script" }],
		legend: {
			tokenTypes,
			tokenModifiers,
		},
		full: {
			delta: true,
		},
		range: false,
	})
})

const semanticDataCache = new Map<string, number[]>()
connection.onRequest(SemanticTokensRequest.type, (params): SemanticTokens | null => {
	const textDocument = documents.get(params.textDocument.uri)
	if (textDocument == null) return null
	const script = textDocument.getText()

	const diagnostics: Diagnostic[] = []
	const data: number[] = []

	let lastLine = 0
	let lastColumn = 0
	function addSemanticToken(
		location: Token.Location,
		tokenType: keyof typeof SemanticTokenTypes,
		tokenModifier: keyof typeof SemanticTokenModifiers
	) {
		const line = script.substring(0, location.startAt).split("\n").length - 1
		const column = script.substring(0, location.startAt).split("\n").pop()!.length
		if (line !== lastLine) lastColumn = 0
		data.push(...createSemanticToken(line - lastLine, column - lastColumn, location.endAt - location.startAt, tokenType, tokenModifier))
		lastLine = line
		lastColumn = column
	}

	function analyzeToken(token: Token) {
		const startLine = script.substring(0, token.location.startAt).split("\n").length - 1
		const startColumn = script.substring(0, token.location.startAt).split("\n").pop()!.length

		const endLine = script.substring(0, token.location.endAt).split("\n").length - 1
		const endColumn = script.substring(0, token.location.endAt).split("\n").pop()!.length

		diagnostics.push({
			severity: DiagnosticSeverity.Information,
			range: {
				start: { line: startLine, character: startColumn },
				end: { line: endLine, character: endColumn },
			},
			message: `Token type: ${token.type} Line: ${startLine} Character: ${startColumn}`,
		})

		if (Token.is(Tokens.NumberLiteral, token)) addSemanticToken(token.location, "number", "declaration")
		else if (Token.is(Tokens.StringLiteral, token)) addSemanticToken(token.location, "string", "declaration")
		else if (Token.is(Tokens.Name, token) && token.meta.type === "type") addSemanticToken(token.location, "type", "declaration")
		else if (Token.is(Tokens.Name, token) && token.meta.type === "value") addSemanticToken(token.location, "variable", "declaration")
		else if (Token.is(Tokens.Symbol, token)) addSemanticToken(token.location, "operator", "declaration")
		else if (Token.is(Tokens.Keyword, token)) addSemanticToken(token.location, "keyword", "declaration")
	}

	const root = Token.tokenizeScript(script)
	if (!root) return null
	if (root instanceof ScriptReader.SyntaxError) {
		const startLine = script.substring(0, root.at).split("\n").length - 1
		const startColumn = script.substring(0, root.at).split("\n").pop()!.length

		const endLine = script.substring(0, root.at + 1).split("\n").length - 1
		const endColumn = script
			.substring(0, root.at + 1)
			.split("\n")
			.pop()!.length

		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: { line: startLine, character: startColumn },
				end: { line: endLine, character: endColumn },
			},
			message: root.message,
		})

		connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
		return {
			data: semanticDataCache.get(textDocument.uri) ?? [],
		}
	}

	const tokensSet = new Set<Token>()
	function pushTokens(tokens: Token[]) {
		for (const token of tokens) {
			if (tokensSet.has(token)) continue
			tokensSet.add(token)
			const values = Object.values(token.meta)
			for (const value of values) {
				if (Array.isArray(value)) pushTokens(value)
				else if (Token.is(value)) pushTokens([value])
			}
		}
	}
	pushTokens(root.meta.tokens)
	const sortedTokens = [...tokensSet].sort((a, b) => a.location.startAt - b.location.startAt)

	console.log(JSON.stringify(root, null, "\t"))
	sortedTokens.forEach(analyzeToken)
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
	semanticDataCache.set(textDocument.uri, data)
	return { data }
})

connection.onCompletion((textDocumentPositionParams: TextDocumentPositionParams): CompletionItem[] => {
	const { line, character } = textDocumentPositionParams.position

	return [
		{
			label: "TypeScriptt",
			kind: CompletionItemKind.Color,
			documentation: `Line: ${line} Character: ${character}`,
		},
		{
			label: "JavaScript",
			kind: CompletionItemKind.Text,
			data: 2,
		},
	]
})

documents.listen(connection)
connection.listen()
