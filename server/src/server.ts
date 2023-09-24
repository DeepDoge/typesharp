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
import { tokenize, type Token } from "./tokenize"
import { KeywordToken } from "./tokenize/keywordToken"
import { LiteralToken } from "./tokenize/literalToken"
import { ScriptReader } from "./tokenize/reader"
import { SymbolToken } from "./tokenize/symbolToken"
import { TypeNameToken } from "./tokenize/typeNameToken"
import { VariableNameToken } from "./tokenize/variableNameToken"

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

// TODO: i have no idea why SemanticTokens acts weird,
// idk what im doing wrong, logs are right, everything is right,
// but it doesnt work right
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
			message: `Token type: ${token.tokenType}`,
		})

		if (LiteralToken.Number.is(token)) {
			addSemanticToken(token.location, "number", "declaration")
		} else if (KeywordToken.is(token)) {
			addSemanticToken(token.location, "keyword", "declaration")
		} else if (TypeNameToken.is(token)) {
			addSemanticToken(token.location, "type", "declaration")
		} else if (VariableNameToken.is(token)) {
			addSemanticToken(token.location, "variable", "declaration")
		} else if (SymbolToken.is(token)) {
			addSemanticToken(token.location, "operator", "declaration")
		}

		const entries = Object.entries(token)
		for (const [key, value] of entries) {
			if (typeof value === "object" && value !== null) {
				if (Array.isArray(value)) {
					const arr = value as unknown[]
					for (const item of arr) {
						if (typeof item !== "object" || item == null || !("tokenType" in item)) continue
						const token = item as Token
						analyzeToken(token)
					}
				} else if ("tokenType" in value) {
					const token = value as Token
					analyzeToken(token)
				}
			}
		}
	}

	const result = tokenize(script)
	if (result instanceof ScriptReader.SyntaxError) {
		const startLine = script.substring(0, result.at).split("\n").length - 1
		const startColumn = script.substring(0, result.at).split("\n").pop()!.length

		const endLine = script.substring(0, result.at + 1).split("\n").length - 1
		const endColumn = script
			.substring(0, result.at + 1)
			.split("\n")
			.pop()!.length

		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: { line: startLine, character: startColumn },
				end: { line: endLine, character: endColumn },
			},
			message: result.message,
		})

		connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
		return {
			data: semanticDataCache.get(textDocument.uri) ?? [],
		}
	}

	result.forEach(analyzeToken)
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
