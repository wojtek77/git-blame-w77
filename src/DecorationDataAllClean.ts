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
        const colors = vscode.workspace.getConfiguration('gitBlameW77').colors;
        let hashColors: {[key: string]: string} = {};
        let j = 0;
        let lastHash;
        for (let i = 1; i <= linecount; ++i) {
            const rec = blameData[i];
            let text;
            let color;
            if (rec && rec.hash.match(/[1-9a-f]/)) {
                text = this._lineText(rec);
                if (rec.hash !== lastHash) {
                    const k = j % colors.length;
                    if (colors[k] && hashColors[rec.hash] === undefined) {
                        hashColors[rec.hash] = colors[k]
                        j += 1;
                    }
                }
                if (hashColors[rec.hash]) {
                    color = hashColors[rec.hash];
                }
                lastHash = rec.hash;
            } else {
                text = emptyLine;
            }
            const hoverMessage = this._lineHoverMessage(rec);
            const lineDecoration = this._lineDecoration(i-1, text, color, hoverMessage);
            decoration.push(lineDecoration);
        }
        return decoration;
    }
}
