import * as vscode from 'vscode';
import { BlameData } from './GitBlame';
import { DecorationDataBase } from './DecorationDataBase';

/**
 * Represents data of blame decoration (all lines) for clean document
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataAllClean extends DecorationDataBase {
    public constructor(isDocumentTmp: boolean, workspaceFolder: string, gitBlameUrlFn?: (rec: BlameData) => string) {
        super();
        this.workspaceFolder = workspaceFolder;
        this.gitBlameUrlFn = gitBlameUrlFn;
        /* colors */
        const confColors = vscode.workspace.getConfiguration('gitBlameW77').colors;
        const themeKind = [vscode.ColorThemeKind.Dark, vscode.ColorThemeKind.HighContrast].includes(vscode.window.activeColorTheme.kind) ? 'dark' : 'light';
        this.colors = (confColors[themeKind] !== undefined) ? confColors[themeKind] : confColors;
        this.colorsUsedAsBackground = vscode.workspace.getConfiguration('gitBlameW77').colorsUsedAsBackground;
        this.dateLocale = vscode.workspace.getConfiguration('gitBlameW77').dateLocale || undefined;
        this.decorationShowHash = vscode.workspace.getConfiguration('gitBlameW77').decorationShowHash;
        this.hoverEnabled = vscode.workspace.getConfiguration('editor.hover').enabled && vscode.workspace.getConfiguration('gitBlameW77').hoverEnabled;
        this.hoverShowLinkToGitGuiBlame = !isDocumentTmp && vscode.workspace.getConfiguration('gitBlameW77').hoverShowLinkToGitGuiBlame;
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
