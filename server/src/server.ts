/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type { CompletionItem, Diagnostic, InitializeParams, InitializeResult, TextDocumentPositionParams } from "vscode-languageserver/node"
import {
	CompletionItemKind,
	DiagnosticSeverity,
	DidChangeConfigurationNotification,
	ProposedFeatures,
	TextDocumentSyncKind,
	TextDocuments,
	createConnection,
} from "vscode-languageserver/node"

import { TextDocument } from "vscode-languageserver-textdocument"
import { tokenize, type Token } from "./tokenize"
import { ScriptReader } from "./tokenize/reader"

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false
let hasDiagnosticRelatedInformationCapability = false

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration)
	hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders)
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	)

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
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

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined)
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders((_event) => {
			connection.console.log("Workspace folder change event received.")
		})
	}
})

// The example settings
interface ExtensionSettings {
	maxNumberOfProblems: number
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExtensionSettings = { maxNumberOfProblems: 1000 }
let globalSettings: ExtensionSettings = defaultSettings

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExtensionSettings>> = new Map()

connection.onDidChangeConfiguration((change) => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear()
	} else {
		globalSettings = (change.settings.languageServerExample || defaultSettings) as ExtensionSettings
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument)
})

function getDocumentSettings(resource: string): Thenable<ExtensionSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings)
	}
	let result = documentSettings.get(resource)
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: "bullScriptLanguageServer",
		})
		documentSettings.set(resource, result)
	}
	return result
}

// Only keep settings for open documents
documents.onDidClose((e) => {
	documentSettings.delete(e.document.uri)
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document)
})

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	const settings = await getDocumentSettings(textDocument.uri)
	const diagnostics: Diagnostic[] = []

	const script = textDocument.getText()

	// I don't know how to use this LSP sh*t atm, so I'm just gonna abuse diagnostics for now
	// TODO: Use LSP properly
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
	} else {
		console.log(JSON.stringify(result, null, "\t"))
		result.forEach(analyzeToken)
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}

connection.onDidChangeWatchedFiles((_change) => {
	// Monitored files have change in VSCode
	connection.console.log("We received an file change event")
})

// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	const { line, character } = _textDocumentPosition.position

	return [
		{
			label: "TypeScriptt",
			kind: CompletionItemKind.Interface,
			data: {
				cssClass: "interface-item",
			},
			documentation: `Line: ${line} Character: ${character}`,
		},
		{
			label: "JavaScript",
			kind: CompletionItemKind.Text,
			data: 2,
		},
	]
})

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	return item
})

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()
