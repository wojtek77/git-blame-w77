import path from "path";
import * as vscode from "vscode";
import { Util } from "./Util";

/**
 * Represents function for git show
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class GitShow {
    private static instance: GitShow;
    static getInstance() {
        if (!this.instance) {
            this.instance = new GitShow();
        }
        return this.instance;
    }

    public async getFileContent(workspaceFolder: string, relativeFile: string, hash: string) {
        relativeFile = '"'+relativeFile+'"'; // workaround if has spaces
        let cd;
        if (path.sep === '\\') { // if is Windows
            cd = 'cd /d';
        } else {
            cd = 'cd';
        }
        
        try {
            const content = await Util.getInstance().spawnAsync(`${cd} ${workspaceFolder} && git show ${hash}:${relativeFile}`, {
                shell: true
            });
            return content;
        } catch (e) {
            const error = (e as Error);
            if (error.message.includes('git')) {
                vscode.window.showInformationMessage('No git repository');
            } else {
                vscode.window.showErrorMessage(error.message);
                throw e;
            }
        }
    }
}
