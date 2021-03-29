const fs = require('fs/promises');
const glob = require('glob');

exports.parseTweeString = (str, extraLinkParsers) => {
    let ret = [];
    let passageSpit = str.split('\n::');
    passageSpit[0] = passageSpit[0].slice(2);
    for(let i = 0; i < passageSpit.length; i++) {
        let title = passageSpit[i].slice(0, passageSpit[i].indexOf('\n'));
        let text = passageSpit[i].substring(title.length + 1).trim();
        let start = title.indexOf('[');
        let tags = [];
        if(start !== -1) {
            //Have tags...
            let tagStr = title.substr(start+1, title.indexOf(']')-(start+1));
            tags = tagStr.split(' ');
            title = title.substr(0, start-1);
        } else {
            //Might still have other stuff...
            start = title.indexOf('{');
            if(start !== -1) {
                title = title.substr(0, start-1);
            }
        }
        let links = getLinks(text);
        if(extraLinkParsers !== undefined){
            if(!Array.isArray(extraLinkParsers)) {
                extraLinkParsers = [extraLinkParsers];
            }
            for(let j = 0; j < extraLinkParsers.length; j++) {
                links = extraLinkParsers[j](text, links);
            }
        }
        title = title.substr(1);
        title = title.trim();
        ret.push({title: title, tags: tags, links: links});
    }
    return Promise.resolve(ret);
}

exports.parseTweeFile = (filename, extraLinkParsers) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8').then((buff) => {
            let str = buff.toString();
            exports.parseTweeString(str, extraLinkParsers).then((passages) => {
                for(let i = 0; i < passages.length; i++) {
                    passages[i].filename = filename;
                }
                resolve(passages);
            }).catch(reject);
        }).catch(reject);
    });
}

exports.parseTweeFolder = (path, extraLinkParsers) => {
    let files = glob.sync(path+'/**/*.tw');
    let promises = [];
    for(let i = 0; i < files.length; i++) {
        promises.push(exports.parseTweeFile(files[i], extraLinkParsers));
    }
    let res = [];
    return new Promise((resolve, reject) => {
        Promise.allSettled(promises).then((results) => {
            for(let i = 0; i < results.length; i++) {
                let values = results[i].value;
                res = res.concat(values);
            }
            resolve(res);
        });
    });
}

const regexes = [
    /\[\[([^|\]]+)\|?([^\]]+)?\]\[?([^\]]+)?\]\]?/,   /* This matches standard Twine Links */
    /<<link "?([^(">)]+)"? "?([^(">)]+)"?>>/,         /* This matches SugarCube <<link>>s */
    /<<goto "?([^(">)]+)"?>>/,                        /* This matches SugarCube <<goto>>s */
    /<<onetimelink "?([^(">)]+)"? "?([^(">)]+)"?>>/   /* This matches my custom <<onetimelink>>s */
];

function getLinks(str) {
    let links = [];
    for(let i = 0; i < regexes.length; i++) {
        let globRegEx = new RegExp(regexes[i], 'gm');
        let globMatches = str.match(globRegEx);
        if(globMatches === null) {
            continue;
        }
        for(let j = 0; j < globMatches.length; j++) {
            let matches = globMatches[j].match(regexes[i]);
            if(matches.length >= 3 && matches[2] !== undefined) {
                links.push({text: matches[1], passage: matches[2]});
            } else {
                links.push({text: matches[1], passage: matches[1]});
            }
        }
    }
    return links;
}