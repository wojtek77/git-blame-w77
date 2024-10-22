import * as vscode from 'vscode';
import { BlameData } from './GitBlame';
import { DecorationDataBase as DecorationDataBase } from './DecorationDataBase';

/**
 * Represents manager of status bar item
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class StatusBarItemManager extends DecorationDataBase {
    public constructor(workspaceFolder: string, gitBlameUrl?: string) {
        super();
        this.workspaceFolder = workspaceFolder;
        this.gitBlameUrl = gitBlameUrl;
        this.dateLocale = vscode.workspace.getConfiguration('gitBlameW77').dateLocale || undefined;
    }
    
    public show(statusBarItem: vscode.StatusBarItem, activeEditor: vscode.TextEditor, blameData: BlameData[]) {
        const lineNumber = activeEditor.selection.active.line+1;
        if (blameData[lineNumber] !== undefined && blameData[lineNumber].isCommitted) {
            const rec = blameData[lineNumber];
            statusBarItem.text = `Blame line ${lineNumber} ${rec.author}`;
            statusBarItem.tooltip = this._lineMessage(rec, true, true);
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    }
}
