import * as vscode from 'vscode';
import { Command } from './Command';
import { BlameDecoration } from './BlameDecoration';
import { DocumentTmpProvider } from './DocumentTmpProvider';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
    /* 
        https://github.com/microsoft/vscode-extension-samples/tree/main/decorator-sample
        This extension was made based on the above
    */
    
    function createDecoration(args: {workspaceFolder?: string, relativeFile?: string, hash?: string}) {
        const activeEditor = vscode.window.activeTextEditor
        const fileName = activeEditor ? activeEditor.document.fileName : '';
        if (decorations[fileName] === undefined) {
            decorations[fileName] = new BlameDecoration(args);
        }
        decorations[fileName].activeEditor = activeEditor;
        return decorations[fileName];
    }
    function isUsingDecoration() {
        for (const k in decorations) {
            if (decorations[k].isOpen) {
                return true;
            }
        }
        return false;
    }
    
    let decorations: {[key: string]: BlameDecoration} = {}; // cache of decorations
    
    let unsubscribeOnDidChangeActiveTextEditor: vscode.Disposable | null;
    let unsubscribeOnDidCloseTextDocument: vscode.Disposable | null;
    let unsubscribeOnDidSaveTextDocument: vscode.Disposable | null;
    let unsubscribeOnDidChangeTextDocument: vscode.Disposable | null;
    let unsubscribeOnDidChangeTextEditorSelection: vscode.Disposable | null;
    
    /* register commands */
    context.subscriptions.push(vscode.commands.registerCommand('gitBlameW77.runGitGuiBlameForHash', () => {
        Command.getInstance().runGitGuiBlameForHash();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitBlameW77.runGitGuiBlameForFile', () => {
        Command.getInstance().runGitGuiBlameForFile();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitBlameW77.toggleBlameDecoration', () => {
        const isOpen = createDecoration({}).toggleBlameDecoration();
        if (isOpen) {
            eventsSwitchOn();
        } else if (!isUsingDecoration()) {
            eventsSwitchOff();
            decorations = {}; // clear cache
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitBlameW77.showBlamePrevious', async ({workspaceFolder, relativeFile, hash, previousHash, line}) => {
        await DocumentTmpProvider.getInstance().createDocBlamePrevious(workspaceFolder, relativeFile, hash, previousHash, line);
        createDecoration({workspaceFolder: workspaceFolder, relativeFile: relativeFile, hash: previousHash}).openBlameDecoration();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitBlameW77.showBlamePreviousIgnoreRev', async ({workspaceFolder, relativeFile, hash, line}) => {
        const r = await DocumentTmpProvider.getInstance().createDocBlamePreviousIgnoreRev(workspaceFolder, relativeFile, hash, line);
        if (r) {
            createDecoration({workspaceFolder: workspaceFolder, relativeFile: r.relativeFilePrevious, hash: r.hashPrevious}).openBlameDecoration();
        }
    }));
    
    /* register events */
    function eventsSwitchOn() {
        if (unsubscribeOnDidChangeActiveTextEditor) {
            return;
        }
        unsubscribeOnDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
            BlameDecoration.statusBarItem.hide();
            if (editor) {
                const fileName = editor.document.fileName;
                if (decorations[fileName] !== undefined && decorations[fileName].isOpen) {
                    decorations[fileName].activeEditor = editor;
                    decorations[fileName].openBlameDecoration();
                }
            }
        }, null, context.subscriptions);
        unsubscribeOnDidCloseTextDocument = vscode.workspace.onDidCloseTextDocument(document => {
            delete decorations[document.fileName];
            if (!isUsingDecoration()) {
                eventsSwitchOff();
            }
        }, null, context.subscriptions);
        unsubscribeOnDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument(document => {
            const fileName = document.fileName;
            if (decorations[fileName].isOpen) {
                const activeEditor = decorations[fileName].activeEditor;
                if (activeEditor && document === activeEditor.document) {
                    if (decorations[fileName].lastSavedVersion !== document.version) {
                        decorations[fileName].openBlameDecoration();
                    }
                }
            }
        }, null, context.subscriptions);
        unsubscribeOnDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
            const fileName = event.document.fileName;
            if (decorations[fileName].isOpen) {
                const activeEditor = decorations[fileName].activeEditor;
                if (activeEditor && event.document === activeEditor.document) {
                    if (event.contentChanges.length) {
                        decorations[fileName].updateBlameDecoration(event.contentChanges);
                    }
                }
            }
        }, null, context.subscriptions);
        unsubscribeOnDidChangeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection(event => {
            const fileName = event.textEditor.document.fileName;
            if (decorations[fileName].isOpen) {
                const activeEditor = decorations[fileName].activeEditor;
                if (activeEditor && event.textEditor === activeEditor) {
                    decorations[fileName].updateStatusBarItem(event.textEditor);
                }
            }
        }, null, context.subscriptions);
    }
    function eventsSwitchOff() {
        if (!unsubscribeOnDidChangeActiveTextEditor) {
            return;
        }
        unsubscribeOnDidChangeActiveTextEditor.dispose();
        unsubscribeOnDidChangeActiveTextEditor = null;
        unsubscribeOnDidCloseTextDocument?.dispose();
        unsubscribeOnDidCloseTextDocument = null;
        unsubscribeOnDidSaveTextDocument?.dispose();
        unsubscribeOnDidSaveTextDocument = null;
        unsubscribeOnDidChangeTextDocument?.dispose();
        unsubscribeOnDidChangeTextDocument = null;
        unsubscribeOnDidChangeTextEditorSelection?.dispose();
        unsubscribeOnDidChangeTextEditorSelection = null;
    }
    
    /* register others */
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(DocumentTmpProvider.scheme, DocumentTmpProvider.getInstance()));
}
