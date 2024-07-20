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
    
    let decorations: {[key: string]: BlameDecoration} = {};
    
    /* register commands */
    vscode.commands.registerCommand('gitBlameW77.runGitGuiBlameForHash', () => {
        Command.getInstance().runGitGuiBlameForHash();
    });
    vscode.commands.registerCommand('gitBlameW77.runGitGuiBlameForFile', () => {
        Command.getInstance().runGitGuiBlameForFile();
    });
    vscode.commands.registerCommand('gitBlameW77.toggleBlameDecoration', () => {
        createDecoration().toggleBlameDecoration();
    });
    
    /* register events */
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            const fileName = editor.document.fileName;
            if (decorations[fileName] !== undefined && decorations[fileName].isOpen) {
                decorations[fileName].activeEditor = editor;
                decorations[fileName].openBlameDecoration(true);
            }
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidCloseTextDocument(document => {
        delete decorations[document.fileName];
    }, null, context.subscriptions);
    vscode.workspace.onDidSaveTextDocument(document => {
        const fileName = document.fileName;
        if (decorations[fileName].isOpen) {
            const activeEditor = decorations[fileName].activeEditor;
            if (activeEditor && document === activeEditor.document) {
                if (decorations[fileName].lastSavedVersion !== document.version) {
                    decorations[fileName].lastSavedVersion = document.version;
                    decorations[fileName].openBlameDecoration(false);
                }
            }
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(event => {
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
