import * as vscode from 'vscode';
import { GitBlame, BlameData } from './GitBlame';
import { DecorationDataAllClean } from './DecorationDataAllClean';
import { DecorationDataAllDirty } from './DecorationDataAllDirty';

/**
 * Represents blame decoration use in vscode
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class BlameDecoration {
    public activeEditor?: vscode.TextEditor;
    public isOpen: boolean = false;
    public lastSavedVersion?: number; // for clean document
    private lastLineCount?: number; // for dirty document
    private isLastOpenCleanDoc?: boolean; // if last time was opened clean document
    private blameDecorationType: vscode.TextEditorDecorationType;
    private blameData: BlameData[] = []; // cache
    private decoration: vscode.DecorationOptions[] = []; // cache 
    private decorationDirty: vscode.DecorationOptions[] = []; // cache 
    
    public constructor() {
        this.activeEditor = vscode.window.activeTextEditor;
        this.blameDecorationType = vscode.window.createTextEditorDecorationType({
            before: {
                color: new vscode.ThemeColor('editor.foreground'),
                height: 'editor.lineHeight',
                margin: '0 10px 0 0',
            }
        });
    }
    
    public toggleBlameDecoration() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.openBlameDecoration();
        } else {
            this.activeEditor?.setDecorations(this.blameDecorationType, []);
        }
    }
    
    public async openBlameDecoration() {
        if (this.activeEditor) {
            const decoration = this.activeEditor.document.isDirty
                                ? (this.getDecorationDirty(this.activeEditor.document) || this.decorationDirty)
                                : await this.getDecorationClean(this.activeEditor.document);
            this.activeEditor.setDecorations(this.blameDecorationType, decoration);
        }
    }
    
    public async updateBlameDecoration(contentChanges: readonly vscode.TextDocumentContentChangeEvent[]) {
        if (this.activeEditor) {
            const decoration = this.getDecorationDirty(this.activeEditor.document, contentChanges);
            if (decoration) {
                this.activeEditor.setDecorations(this.blameDecorationType, decoration);
            }
        }
    }
    
    private async getDecorationClean(document: vscode.TextDocument) {
        this.isLastOpenCleanDoc = true;
        
        /* use cache */
        if (this.lastSavedVersion === document.version) {
            return this.decoration;
        }
        
        /* for clean document */
        this.blameData = await GitBlame.getInstance().getBlameData(document.fileName);
        if (!this.blameData.length) {
            throw new Error('Problem with get git blame data');
        }
        const decoration = new DecorationDataAllClean().getData(document, this.blameData);
        this.decoration = decoration;
        this.lastSavedVersion = document.version;
        return decoration;
    }
    
    private getDecorationDirty(document: vscode.TextDocument, contentChanges?: readonly vscode.TextDocumentContentChangeEvent[]) {
        const isLastOpenCleanDoc = this.isLastOpenCleanDoc;
        this.isLastOpenCleanDoc = false;
        
        if (this.lastLineCount !== document.lineCount) {
            this.lastLineCount = document.lineCount;
            this.decorationDirty = new DecorationDataAllDirty().getData(document);
            return this.decorationDirty;
        } else if (isLastOpenCleanDoc) {
            return this.decorationDirty;
        } else if (contentChanges) { // workaround with wrong present data
            for (let i = 0; i < contentChanges.length; ++i) {
                if (contentChanges[i].text.match(/[\r\n]/)) {
                    return this.decorationDirty;
                }
            }
        }
        // if is in cache return undefined
        return;
    }
}
