import * as vscode from 'vscode';
import { Util } from './Util';
import { DecorationDataBase } from './DecorationDataBase';

/**
 * Represents data of blame decoration (all lines) for dirty document
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataAllDirty extends DecorationDataBase {
    public getData(document: vscode.TextDocument) {
        const decoration: vscode.DecorationOptions[] = [];
        const linecount = document.lineCount || 0;
        for (let i = 1; i < linecount; ++i) {
            const text = Util.getInstance().fillAndTruncate('*** document is not saved ***', 29, String.fromCharCode(160));
            const lineDecoration = this._lineDecoration(i-1, text);
            decoration.push(lineDecoration);
        }
        decoration.push(this._lineDecoration(linecount, this._emptyLine()));
        return decoration;
    }
}
