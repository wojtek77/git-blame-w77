import * as vscode from 'vscode';
import { BlameData } from './GitBlame';
import { DecorationDataBase } from './DecorationDataBase';

/**
 * Represents data of blame decoration (all lines) for clean document
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataAllClean extends DecorationDataBase {
    public getData(document: vscode.TextDocument, blameData: BlameData[]) {
        const decoration: vscode.DecorationOptions[] = [];
        const linecount = document.lineCount || 0;
        const emptyLine = this._emptyLine();
        for (let i = 1; i <= linecount; ++i) {
            const rec = blameData[i];
            let text;
            if (rec && rec.hash.match(/[1-9a-f]/)) {
                text = this._lineText(rec);
            } else {
                text = emptyLine;
            }
            const hoverMessage = this._lineHoverMessage(rec);
            const lineDecoration = this._lineDecoration(i-1, text, undefined, hoverMessage);
            decoration.push(lineDecoration);
        }
        return decoration;
    }
}
