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
            const util = Util.getInstance();
            const fileName = activeEditor.document.fileName;
            const workspaceFolder = util.workspaceFolder();
            const relativeFile = '"'+util.relativeFile(workspaceFolder, fileName)+'"'; // workaround if has spaces
            if (workspaceFolder && relativeFile) {
                let lineNumber = activeEditor.selection.active.line+1;
                let hash = '';
                if (isHash) {
                    const blameData = await GitBlame.getInstance().getBlameData(workspaceFolder, relativeFile, undefined, lineNumber);
                    if (blameData === undefined) {
                        return;
                    }
                    hash = blameData[1].hash;
                    lineNumber = blameData[1].hash_1;
                } else {
                    if (lineNumber === activeEditor.document.lineCount) { // workaround if is marked the last line with no git blame
                        --lineNumber;
                        // vscode.window.showInformationMessage('The marked line has no blame git');
                        // return;
                    }
                }
                let cd;
                if (workspaceFolder.match(/[\\]/)) { // if is Windows
                    cd = 'cd /d';
                } else {
                    cd = 'cd';
                }
                const cmd = `${cd} ${workspaceFolder} && git gui blame --line=${lineNumber} ${hash} ${relativeFile}`;
                exec(cmd, (error, stdout, stderr) => {
                    if (error?.code === 1) { // no installed Git Gui
                        vscode.window.showInformationMessage('Is not installed Git Gui');
                    }
                });
            }
        }
    }
}
