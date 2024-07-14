import * as vscode from 'vscode';
import { GitBlame, BlameData } from './GitBlame';
import { Util } from './Util';

/**
 * Represents blame decoration use in vscode
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class BlameDecoration {
    public activeEditor?: vscode.TextEditor;
    public isOpen: boolean = false;
    private blameDecorationType: vscode.TextEditorDecorationType;
    private blameData: BlameData[] = []; // cache
    
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
        if (this.isOpen && this.activeEditor) {
            const decoration = await this.getBlamedDecoration(this.activeEditor.document);
            if (decoration) {
                this.activeEditor.setDecorations(this.blameDecorationType, decoration);
                this.isOpen = true;
                return;
            }
        }
        this.isOpen = false;
    }
    
    private async getBlamedDecoration(document: vscode.TextDocument) {
        if (!this.blameData.length || !document.isDirty) {
            this.blameData = await GitBlame.getInstance().getBlameData(document.fileName);
            if (!this.blameData.length) {
                return;
            }
        }
        const blameData = structuredClone(this.blameData);
        const editorData = this.getEditorData(document);
        const decoration: vscode.DecorationOptions[] = [];
        const linecount = document.lineCount || 0;
        const util = Util.getInstance();
        const noBreakSpace = String.fromCharCode(160);
        const emptyLine = noBreakSpace.repeat(29);
        for (let i = 1; i <= linecount; ++i) {
            const startPos = new vscode.Position(i-1, 0);
            const endPos = new vscode.Position(i-1, 0);
            const range = new vscode.Range(startPos, endPos);
            
            const key = this.findData(i, blameData, editorData);
            let rec;
            if (key) {
                rec = blameData[key];
                delete blameData[key];
            } else {
                rec = undefined;
            }
            
            const decorationOptions: vscode.ThemableDecorationAttachmentRenderOptions = {
                contentText: (rec && rec.hash.match(/[1-9a-f]/))
                    ? util.fillAndTruncate(rec.hash, 7, noBreakSpace)
                        +' '
                        /* https://stackoverflow.com/questions/27939773/tolocaledatestring-short-format */
                        +new Date(rec.timestamp * 1000).toLocaleDateString('en-CA')
                        +' '
                        +util.fillAndTruncate(rec.email, 7, noBreakSpace, '...')
                    : emptyLine,
                // backgroundColor: 'red'
            };
            const hoverMessage = new vscode.MarkdownString('foo')
    
            decoration.push({
                range: range,
                renderOptions: {
                    before: decorationOptions
                },
                // hoverMessage: hoverMessage
            });
        }

        return decoration;
    }
    
    private findData(i: number, blameData: BlameData[], editorData: string[]) {
        if (blameData[i] && blameData[i].text === editorData[i]) {
            return i;
        }
        // for (let j = 1; j <= blameData.length; ++j) {
        //     if (blameData[j] && blameData[j].text === editorData[i]) {
        //         return j;
        //     }   
        // }
        for (let j = i-1; j >= 1; --j) {
            if (blameData[j] && blameData[j].text === editorData[i]) {
                return j;
            }   
        }
        for (let j = i+1; j <= blameData.length; ++j) {
            if (blameData[j] && blameData[j].text === editorData[i]) {
                return j;
            }   
        }
    }
    
    private getEditorData(document: vscode.TextDocument) {
        let editorData: string[] = [];
        const data = document.getText().split('\n');
        const max = data.length;
        for (let i = 1; i <= max; ++i) {
            editorData[i] = data[i-1].replace('\r', '');
        }
        return editorData;
    }
}
