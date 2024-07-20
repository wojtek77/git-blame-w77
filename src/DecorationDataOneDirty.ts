import * as vscode from 'vscode';
import { BlameData } from './GitBlame';
import { DecorationDataBase } from './DecorationDataBase';
import { DecorationDataAllClean } from './DecorationDataAllClean';

/**
 * Represents data of blame decoration (one lines) for dirty document
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataOneDirty extends DecorationDataBase {
    public getData(document: vscode.TextDocument, blameData: BlameData[], decoration: vscode.DecorationOptions[],
                    contentChanges: readonly vscode.TextDocumentContentChangeEvent[]) {
        const line = vscode.window.activeTextEditor?.selection.active.line;
        if (line !== undefined) {
            if (this.isNewLineDown(contentChanges)) {
                return this.newLineDown(document, blameData, decoration, contentChanges);
            }
            this.changeInLine(document, blameData, decoration, line);
        }
        return {blameData, decoration};
    }
    
    private isNewLineDown(contentChanges: readonly vscode.TextDocumentContentChangeEvent[]) {
        const range = contentChanges[0].range;
        const text = contentChanges[0].text;
        return range.isSingleLine && text.match(/[\r\n]$/);
    }
    
    private newLineDown(document: vscode.TextDocument, blameData: BlameData[], decoration: vscode.DecorationOptions[],
                        contentChanges: readonly vscode.TextDocumentContentChangeEvent[]) {
        const range = contentChanges[0].range;
        const text = contentChanges[0].text;
        const pattern = /(.*)[\r\n]+/g;
        const matches = [...text.matchAll(pattern)];
        const line = range.start.line + matches.length;
        let blameDataNew: BlameData[] = [];
        blameData.forEach(function(v,k) {
            if (k <= line) {
                blameDataNew[k] = v;
            } else {
                blameDataNew[k + matches.length] = v;
            }
        });
        blameData = blameDataNew;
        decoration = new DecorationDataAllClean().getData(document, blameDataNew);
        return {blameData, decoration};
    }
    
    private changeInLine(document: vscode.TextDocument, blameData: BlameData[], decoration: vscode.DecorationOptions[], line: number) {
        const emptyLine = this._emptyLine();
        const rec = blameData[line+1];
        if (rec) {
            // find text for given line
            const text = this.getLineText(document, line, rec);
            if (text === rec.text) { // text is the same as in git
                const newText = this._lineText(rec);
                decoration[line] = this._lineDecoration(line, newText);
            } else { // text is changed
                decoration[line] = this._lineDecoration(line, emptyLine);
            }
        } else { // text is changed
            decoration[line] = this._lineDecoration(line, emptyLine);
        }
    }
    
    /**
     * get only one character more than git
     */
    private getLineText(document: vscode.TextDocument, line: number, rec: BlameData) {
        return document.getText(
            new vscode.Range(
                new vscode.Position(line, 0),
                new vscode.Position(line, rec.text.length+1)
            )
        );
    }
}
