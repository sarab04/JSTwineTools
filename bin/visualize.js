const me = require('../index.js');
const custom = require('../custom.js');

let args = process.argv.slice(2);

function isValidHttpUrl(string) {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
}

me.parseTweeFolder(args[0], custom.all).then((passages) => {
    let str ='';
    if(args.length < 2 || args[1] === 'dot') {
        str = dotOutput(passages);
    } else {
        switch(args[1]) {
            case 'mermaid':
                str = mermaidOutput(passages);
                break;
            case 'drawio':
                str = drawioOutput(passages);
                break;
            default:
                console.log('Unknown renderer '+args[1]);
                return;
        }
    }
    console.log(str);
});

function escapePassageToNode(passageTitle) {
    return passageTitle.replace(/ /g, '_').replace(/-/g, '').replace(/\'/g, '');
}

function dotOutput(passages) {
    let str = 'digraph {\n';
    for(let i = 0; i < passages.length; i++) {
        let passageName = escapePassageToNode(passages[i].title);
        str += passageName;
        str += '[label="'+passages[i].title+'"];\n';
        for(let j = 0; j < passages[i].links.length; j++) {
            if(isValidHttpUrl(passages[i].links[j].passage)) {
                //Ignore external links...
                continue;
            } else if(passages[i].links[j].passage[0] === '$' || passages[i].links[j].passage[0] === '_') {
                //Ignore variable names...
                continue;
            } else if(passages[i].links[j].passage === 'previous()') {
                //Ignore previous()...
                continue;
            }
            let nextPassageName = escapePassageToNode(passages[i].links[j].passage);
            if(passages[i].links[j].text[0] === '"') {
                str += passageName+' -> '+nextPassageName+' [label="'+passages[i].links[j].text.substr(1).slice(0, -1)+'"];\n';
            } else {
                str += passageName+' -> '+nextPassageName+' [label="'+passages[i].links[j].text+'"];\n';
            }
        }
    }
    str += '}';
    return str;
}

function encodeLinKText(text) {
    return text.replace(/\(/g, '#28').replace(/\)/g, '#29');
}

function mermaidOutput(passages) {
    let str = 'graph TD\n';
    for(let i = 0; i < passages.length; i++) {
        let passageName = escapePassageToNode(passages[i].title);
        str += passageName+'['+passages[i].title+']';
        if(passages[i].links.length === 0) {
            str +='\n';
        } else {
            for(let j = 0; j < passages[i].links.length; j++) {
                if(isValidHttpUrl(passages[i].links[j].passage)) {
                    //Ignore external links...
                    str +='\n';
                    continue;
                } else if(passages[i].links[j].passage[0] === '$' || passages[i].links[j].passage[0] === '_') {
                    //Ignore variable names...
                    str +='\n';
                    continue;
                } else if(passages[i].links[j].passage === 'previous()') {
                    //Ignore previous()...
                    str +='\n';
                    continue;
                }
                if(j === 0) {
                    //First link shares it's line with the title
                    str += ' -->|'+encodeLinKText(passages[i].links[j].text)+'| '+escapePassageToNode(passages[i].links[0].passage)+'['+passages[i].links[0].passage+']\n';
                } else {
                    str += passageName+' -->|'+encodeLinKText(passages[i].links[j].text)+'| '+escapePassageToNode(passages[i].links[j].passage)+'['+passages[i].links[j].passage+']\n';
                }
            }
        }
    }
    return str;
}

function drawioOutput(passages) {
    let str = '# connect: {"from": "refs", "to": "name", "style": "curved=1;fontSize=11;"}\n#\n';
    str += 'name,tags,refs\n';
    for(let i = 0; i < passages.length; i++) {
        let tmp = [];
        for(let j = 0; j < passages[i].links.length; j++) {
            if(isValidHttpUrl(passages[i].links[j].passage)) {
                //Ignore external links...
                continue;
            } else if(passages[i].links[j].passage[0] === '$' || passages[i].links[j].passage[0] === '_') {
                //Ignore variable names...
                continue;
            } else if(passages[i].links[j].passage === 'previous()') {
                //Ignore previous()...
                continue;
            }
            tmp.push(passages[i].links[j].passage);
        }
        str += '"'+passages[i].title+'","'+passages[i].tags.join(',')+'","'+tmp.join(',')+'"\n';
    }
    return str;
}