import * as vscode from 'vscode';
import { Command } from './Command';
import { BlameDecoration } from './BlameDecoration';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
    /* 
        https://github.com/microsoft/vscode-extension-samples/tree/main/decorator-sample
        This extension was made based on the above
    */
    
    function createDecoration() {
        const activeEditor = vscode.window.activeTextEditor
        const fileName = activeEditor ? activeEditor.document.fileName : '';
        if (decorations[fileName] === undefined) {
            decorations[fileName] = new BlameDecoration();
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
    
    let decorations: {[key: string]: BlameDecoration} = {};
    
    let unsubscribeOnDidChangeActiveTextEditor: vscode.Disposable | null;
    let unsubscribeOnDidCloseTextDocument: vscode.Disposable | null;
    let unsubscribeOnDidSaveTextDocument: vscode.Disposable | null;
    let unsubscribeOnDidChangeTextDocument: vscode.Disposable | null;
    
    /* register commands */
    context.subscriptions.push(vscode.commands.registerCommand('gitBlameW77.runGitGuiBlameForHash', () => {
        Command.getInstance().runGitGuiBlameForHash();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitBlameW77.runGitGuiBlameForFile', () => {
        Command.getInstance().runGitGuiBlameForFile();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('gitBlameW77.toggleBlameDecoration', () => {
        const isOpen = createDecoration().toggleBlameDecoration();
        if (isOpen) {
            eventsSwitchOn();
        } else if (!isUsingDecoration()) {
            eventsSwitchOff();
        }
    }));
    
    /* register events */
    function eventsSwitchOn() {
        if (unsubscribeOnDidChangeActiveTextEditor) {
            return;
        }
        unsubscribeOnDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
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
    }
}
