import * as vscode from 'vscode';
import { BlameData } from './GitBlame';
import { DecorationDataBase } from './DecorationDataBase';

/**
 * Represents data of blame decoration (all lines) for clean document
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataAllClean extends DecorationDataBase {
    public constructor(gitBlameUrl?: string) {
        super();
        this.gitBlameUrl = gitBlameUrl;
        this.colors = vscode.workspace.getConfiguration('gitBlameW77').colors;
        this.dateLocale = vscode.workspace.getConfiguration('gitBlameW77').dateLocale || undefined;
        this.decorationShowHash = vscode.workspace.getConfiguration('gitBlameW77').decorationShowHash;
        this.noRecText = this._emptyLine;
    }
    
    public getData(document: vscode.TextDocument, blameData: BlameData[]) {
        const decoration: vscode.DecorationOptions[] = [];
        const linecount = document.lineCount || 0;
        for (let i = 1; i <= linecount; ++i) {
            const rec = blameData[i];
            let lineDecoration;
            if (rec && rec.isCommitted) {
                lineDecoration = this._lineDecorationRec(rec, i-1);
            } else {
                lineDecoration = this._lineDecorationNoRec(i-1);
            }
            decoration.push(lineDecoration);
        }
        return decoration;
    }
}
