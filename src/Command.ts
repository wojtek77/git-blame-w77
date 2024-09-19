import * as vscode from "vscode";
import { exec } from "child_process";
import { Util } from "./Util";
import { GitBlame } from "./GitBlame";

/**
 * Class for any simple commands
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class Command {
    private static instance: Command;
    
    static getInstance() {
        if (!this.instance) {
            this.instance = new Command();
        }
        return this.instance;
    }
    
    public runGitGuiBlameForHash() {
        this.runGitGuiBlame(true);
    }
    
    public runGitGuiBlameForFile() {
        this.runGitGuiBlame(false);
    }
    
    private async runGitGuiBlame(isHash: boolean) {
        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            const fileName = activeEditor.document.fileName;
            const dirname = Util.getInstance().dirname(fileName);
            const basename = '"'+Util.getInstance().basename(fileName)+'"'; // workaround if basename has spaces
            if (dirname && basename) {
                let lineNumber = activeEditor.selection.active.line+1;
                if (lineNumber === activeEditor.document.lineCount) { // workaround if is marked the last line with no git blame
                    --lineNumber;
                    // vscode.window.showInformationMessage('The marked line has no blame git');
                    // return;
                }
                let hash = '';
                if (isHash && lineNumber) {
                    const blameData = await GitBlame.getInstance().getBlameData(fileName, lineNumber);
                    if (blameData === undefined) {
                        return;
                    }
                    hash = blameData[1].hash;
                }
                let cd;
                if (dirname.match(/[\\]/)) { // if is Windows
                    cd = 'cd /d';
                } else {
                    cd = 'cd';
                }
                const cmd = `${cd} ${dirname} && git gui blame --line=${lineNumber} ${hash} ${basename}`;
                exec(cmd);
            }
        }
    }
}
