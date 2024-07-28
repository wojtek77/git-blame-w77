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

    public async getBlameData(filePath: string) {
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
        
        const dirname = Util.getInstance().dirname(filePath);
        const basename = Util.getInstance().basename(filePath);
        let cd;
        if (dirname.match(/[\\]/)) { // if is Windows
            cd = 'cd /d';
        } else {
            cd = 'cd';
        }
        
        try {
            const output = await getChildProcessOutput(`${cd} ${dirname} && git blame --line-porcelain ${basename}`, {
                shell: true
            });
            const blameData = this.parse(output as string);
            return blameData;
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

    private parse(blameText: string) {
        let blameData: BlameData[] = [];
        const blameArr = blameText.split('\n');
        blameArr.pop(); // remove last element because it is empty line
        let line = 1;
        let chunk = [];
        let cache: {[key: string]: BlameData} = {};
        for (let i = 0; i < blameArr.length; ++i) {
            const l = blameArr[i];
            chunk.push(l);
            if (l.charAt(0) === '\t') { // end for chunk
                const hashArr = chunk[0].split(' ');
                const hash = hashArr[0];
                if (cache[hash] === undefined) {
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
                    let text;
                    switch (chunk.length) {
                        case 13:
                            previousArr = chunk[10].split(' ');
                            text = chunk[12].slice(1);
                            break;
                        case 12:
                            text = chunk[11].slice(1);
                            break;
                        default:
                            throw new Error(`incorrect chunk.length: ${chunk.length}`);
                    }
                    cache[hash] = {
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
                        text: text,
                        isCommitted: hash !== '0000000000000000000000000000000000000000',
                        isDiffAuthorCommitter: authorTime !== committerTime || author !== committer || authorMail !== committerMail,
                    } as BlameData;
                }
                
                blameData[line] = cache[hash]
                
                line += 1;
                chunk = [];
            }
        }
        
        return blameData;
    }
}
