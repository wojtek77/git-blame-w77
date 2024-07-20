import * as vscode from "vscode";
import { Util } from "./Util";

export type BlameData = {
    hash: string;
    email: string;
    timestamp: number;
    timezone: string;
    line: number;
    text: string;
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
        const dirname = Util.getInstance().dirname(filePath);
        const basename = Util.getInstance().basename(filePath);
        let cd;
        if (dirname.match(/[\\]/)) { // if is Windows
            cd = 'cd /d';
        } else {
            cd = 'cd';
        }

        const util = require('util');
        const exec = util.promisify(require('child_process').exec);
        try {
            const { stdout, stderr } = await exec(`${cd} ${dirname} && git blame --show-email --root --no-show-name --no-show-stats -t ${basename}`);
            const blameData = this.parse(stdout);
            return blameData;
        } catch (e) {
            const error = (e as Error);
            if (error.message.includes('git')) {
                vscode.window.showInformationMessage('No git repository');
            } else {
                vscode.window.showErrorMessage(error.message);
            }
        }
        return [];
    }

    private parse(blameText: string) {
        const pattern = /^([0-9a-f]+) .*\(<(.*)>\s+(\d+) ([+-]\d+)\s+(\d+)\) (.*)$/gm;
        const matches = [...blameText.matchAll(pattern)];
        let blameData: BlameData[] = [];
        matches.forEach(function(v,k) {
            const hash = v[1];
            if (hash.match(/[1-9a-f]/)) {
                const line = k+1;
                blameData[line] = {
                    hash: hash,
                    email: v[2],
                    timestamp: v[3] as unknown as number,
                    timezone: v[4],
                    line: v[5] as unknown as number,
                    text: v[6]
                } as BlameData;
            }
        });
        return blameData;
    }
}
