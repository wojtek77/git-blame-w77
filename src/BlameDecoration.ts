import * as vscode from 'vscode';
import { GitBlame, BlameData } from './GitBlame';
import { DecorationDataAllClean } from './DecorationDataAllClean';
import { DecorationDataAllDirty } from './DecorationDataAllDirty';
import { DecorationDataOneDirty } from './DecorationDataOneDirty';

/**
 * Represents blame decoration use in vscode
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class BlameDecoration {
    public activeEditor?: vscode.TextEditor;
    public isOpen: boolean = false;
    public lastSavedVersion?: number;
    private blameDecorationType: vscode.TextEditorDecorationType;
    private blameData: BlameData[] = []; // cache
    private decoration: vscode.DecorationOptions[] = []; // cache 
    
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
            this.openBlameDecoration(true);
        } else {
            this.activeEditor?.setDecorations(this.blameDecorationType, []);
        }
    }
    
    public async openBlameDecoration(useCache: boolean) {
        if (this.isOpen && this.activeEditor) {
            const decoration = await this.getDecorationDataAll(this.activeEditor.document, useCache);
            this.activeEditor.setDecorations(this.blameDecorationType, decoration);
        }
    }
    
    public async updateBlameDecoration(contentChanges: readonly vscode.TextDocumentContentChangeEvent[]) {
        if (this.isOpen && this.activeEditor) {
            const decoration = this.getDecorationDataOne(this.activeEditor.document, contentChanges);
            if (decoration) {
                this.activeEditor.setDecorations(this.blameDecorationType, decoration);
            }
        }
    }
    
    private async getDecorationDataAll(document: vscode.TextDocument, useCache: boolean) {
        /* use cache */
        if (useCache && this.decoration.length && this.lastSavedVersion === document.version) {
            return this.decoration;
        }
        
        /* for dirty document */
        if (document.isDirty) {
            return new DecorationDataAllDirty().getData(document);
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
    
    private getDecorationDataOne(document: vscode.TextDocument, contentChanges: readonly vscode.TextDocumentContentChangeEvent[]) {
        const {blameData, decoration} = new DecorationDataOneDirty().getData(document, this.blameData, this.decoration, contentChanges);
        this.blameData = blameData;
        this.decoration = decoration;
        return decoration;
    }
}
