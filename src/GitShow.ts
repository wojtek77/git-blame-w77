import path from "path";
import * as vscode from "vscode";

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
        /* https://stackoverflow.com/questions/69704190/node-child-process-spawn-is-not-returning-data-correctly-when-using-with-funct */
        const { spawn } = require('child_process');
        function getChildProcessOutput(program: string, args?: any): Promise<string> {
            return new Promise((resolve, reject) => {
                let buf = '';
                let err = '';
                const child = spawn(program, args);

                child.stdout.on('data', (data: string) => {
                    buf += data;
                });
                child.stderr.on('data', (data: string) => {
                    err += data;
                });
                child.on('close', (code: number) => {
                    if (code !== 0) {
                        return reject(new Error(err));
                    }
                    resolve(buf);
                });
            });
        }
        
        relativeFile = '"'+relativeFile+'"'; // workaround if has spaces
        let cd;
        if (path.sep === '\\') { // if is Windows
            cd = 'cd /d';
        } else {
            cd = 'cd';
        }
        
        try {
            const content = await getChildProcessOutput(`${cd} ${workspaceFolder} && git show ${hash}:${relativeFile}`, {
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
