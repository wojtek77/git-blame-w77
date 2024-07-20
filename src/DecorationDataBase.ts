import * as vscode from 'vscode';
import { BlameData } from './GitBlame';
import { Util } from './Util';

/**
 * Base functions for decoration data
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataBase {
    protected _lineDecoration(line: number, contentText: string, backgroundColor = undefined) {
        const startPos = new vscode.Position(line, 0);
        const endPos = new vscode.Position(line, 0);
        const range = new vscode.Range(startPos, endPos);
        const decorationOptions: vscode.ThemableDecorationAttachmentRenderOptions = {
            contentText: contentText,
            backgroundColor: backgroundColor,
        };
        return {
            range: range,
            renderOptions: {
                before: decorationOptions
            },
        };
    }
    
    protected _lineText(rec: BlameData) {
        const util = Util.getInstance();
        const noBreakSpace = this._noBreakSpace();
        return util.fillAndTruncate(rec.hash, 7, noBreakSpace)
                +' '
                /* https://stackoverflow.com/questions/27939773/tolocaledatestring-short-format */
                +new Date(rec.timestamp * 1000).toLocaleDateString('en-CA')
                +' '
                +util.fillAndTruncate(rec.email, 7, noBreakSpace, '...');
    }
    
    protected _emptyLine() {
        return this._noBreakSpace().repeat(29);
    }
    
    private _noBreakSpace() {
        return String.fromCharCode(160);
    }
}
