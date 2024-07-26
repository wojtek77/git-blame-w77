import * as vscode from 'vscode';
import { Util } from './Util';
import { DecorationDataBase } from './DecorationDataBase';

/**
 * Represents data of blame decoration (all lines) for dirty document
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataAllDirty extends DecorationDataBase {
    public constructor() {
        super();
        this.noRecText = Util.getInstance().fillAndTruncate('*** document is not saved ***', 29, String.fromCharCode(160));
    }
    
    public getData(document: vscode.TextDocument) {
        const decoration: vscode.DecorationOptions[] = [];
        const linecount = document.lineCount || 0;
        for (let i = 0; i < linecount; ++i) {
            const lineDecoration = this._lineDecorationNoRec(i);
            decoration.push(lineDecoration);
        }
        return decoration;
    }
}
