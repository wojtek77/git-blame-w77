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
            const basename = Util.getInstance().basename(fileName);
            if (dirname && basename) {
                const lineNumber = activeEditor.selection.active.line+1;
                let hash = '';
                if (isHash && lineNumber) {
                    const blameData = await GitBlame.getInstance().getBlameData(fileName);
                    if (blameData === undefined) {
                        return;
                    }
                    hash = blameData[lineNumber].hash;
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
