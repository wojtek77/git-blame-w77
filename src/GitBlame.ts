import * as vscode from "vscode";
import { Util } from "./Util";

export type BlameData = {
    line: number;
    hash: string;
    hash_1: number;
    hash_2: number;
    hash_3?: number;
    author: string;
    authorMail: string;
    authorTime: number;
    authorTz: string;
    committer: string;
    committerMail: string;
    committerTime: number;
    committerTz: string;
    summary: string;
    previousHash?: string;
    previousFilename?: string;
    filename: string;
    text: string;
    isCommitted: boolean;
    isDiffAuthorCommitter: boolean;
};

/**
 * Represents function for git blame
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class GitBlame {
    private static instance: GitBlame;
    static getInstance() {
        if (!this.instance) {
            this.instance = new GitBlame();
        }
        return this.instance;
    }

    public async getBlameData(workspaceFolder: string, relativeFile: string, hash = '', line = 0, extraCmd = '', showErr = true) {
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
        if (hash) {
            hash = '"'+hash+'"'; // workaround if has special chars
        }
        let cd;
        if (workspaceFolder.match(/[\\]/)) { // if is Windows
            cd = 'cd /d';
        } else {
            cd = 'cd';
        }
        const lineRange = (line !== 0) ? `-L ${line},${line}` : '';
        
        try {
            const output = await getChildProcessOutput(`${cd} ${workspaceFolder} && git blame --line-porcelain ${lineRange} ${extraCmd} ${hash} -- ${relativeFile}`, {
                shell: true
            });
            const blameData = this.parse(output as string);
            return blameData;
        } catch (e) {
            const error = (e as Error);
            if (error.message.includes('git')) {
                vscode.window.showInformationMessage('No git repository');
            } else {
                if (showErr) {
                    vscode.window.showErrorMessage(error.message);
                }
                throw e;
            }
        }
    }
    
    public async getGitBlameUrl(workspaceFolder?: string) {
        if (workspaceFolder === undefined) {
            workspaceFolder = Util.getInstance().workspaceFolder();
        }
        let cd;
        if (workspaceFolder.match(/[\\]/)) { // if is Windows
            cd = 'cd /d';
        } else {
            cd = 'cd';
        }

        const util = require('util');
        const exec = util.promisify(require('child_process').exec);
        try {
            const { stdout, stderr } = await exec(`${cd} ${workspaceFolder} && git config --get remote.origin.url`);
            const url = this.url(stdout);
            return url;
        } catch (e) {
            const error = (e as Error);
            if (!error.message.includes('git')) {
                vscode.window.showErrorMessage(error.message);
                throw e;
            }
        }
        return '';
    }
    
    private url(stdout: string) {
        const remoteOriginUrl = stdout.trimEnd();
        let url, s;
        switch (true) {
            case remoteOriginUrl.includes('git@github.com:'):
                const a = remoteOriginUrl.split(':');
                s = a[1].replace(/\.git$/, '');
                url = `https://github.com/${s}/commit/` + '${hash}';
                return url;
            case remoteOriginUrl.includes('https://github.com/'):
                s = remoteOriginUrl.replace('https://github.com/', '').replace(/\.git$/, '');
                url = `https://github.com/${s}/commit/` + '${hash}';
                return url;
            default:
                return '';
        }
    }

    private parse(blameText: string) {
        let blameData: BlameData[] = [];
        const blameArr = blameText.split('\n');
        blameArr.pop(); // remove last element because it is empty line
        let line = 1;
        let chunk = [];
        for (let i = 0; i < blameArr.length; ++i) {
            const l = blameArr[i];
            chunk.push(l);
            if (l.charAt(0) === '\t') { // end for chunk
                const hashArr = chunk[0].split(' ');
                const hash = hashArr[0];
                const author = chunk[1].slice(7);
                const authorMail = chunk[2].slice(13, -1);
                const authorTime = +chunk[3].slice(12);
                const authorTz = chunk[4].slice(10);
                const committer = chunk[5].slice(10);
                const committerMail = chunk[6].slice(16, -1);
                const committerTime = +chunk[7].slice(15);
                const committerTz = chunk[8].slice(13);
                const summary = chunk[9].slice(8);
                
                // if (line !== +hashArr[2] as unknown as number) {
                //     throw new Error('line !== hashArr[2]');
                // }
                
                let previousArr;
                let filename;
                let text;
                switch (chunk.length) {
                    case 13:
                        previousArr = chunk[10].split(' ');
                        filename = chunk[11].slice(9);
                        text = chunk[12].slice(1);
                        break;
                        case 12:
                        filename = chunk[10].slice(9);
                        text = chunk[11].slice(1);
                        break;
                    default:
                        throw new Error(`incorrect chunk.length: ${chunk.length}`);
                }
                blameData[line] = {
                    line: line,
                    hash: hash,
                    hash_1: +hashArr[1],
                    hash_2: +hashArr[2],
                    hash_3: hashArr[3] ? +hashArr[3] : undefined,
                    author: author,
                    authorMail: authorMail,
                    authorTime: authorTime,
                    authorTz: authorTz,
                    committer: committer,
                    committerMail: committerMail,
                    committerTime: committerTime,
                    committerTz: committerTz,
                    summary: summary,
                    previousHash: previousArr !== undefined ? previousArr[1] : undefined,
                    previousFilename: previousArr !== undefined ? previousArr[2] : undefined,
                    filename: filename,
                    text: text,
                    isCommitted: hash !== '0000000000000000000000000000000000000000',
                    isDiffAuthorCommitter: authorTime !== committerTime || author !== committer || authorMail !== committerMail,
                } as BlameData;
                
                line += 1;
                chunk = [];
            }
        }
        
        return blameData;
    }
}
