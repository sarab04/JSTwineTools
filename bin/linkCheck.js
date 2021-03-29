const me = require('../index.js');
const custom = require('../custom.js');

let args = process.argv.slice(2);

const knownDeadEnds = [
    'StoryTitle',
    'StoryData',
    'StoryInit',
    'StoryCaption'
];

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
    let errors = [];
    let deadEnds = [];
    let passageObj = {};
    let links = {};
    let validDeadEndTags = [];
    if(args.length > 1) {
        validDeadEndTags = JSON.parse(args[1]);
    }
    for(let i = 0; i < passages.length; i++) {
        if(passageObj[passages[i].title] !== undefined) {
            errors.push('Passage "'+passage[i].title+'" exists in both file '+passageObj[passages[i].title].filename+' and '+passage[i].filename);
            continue;
        }
        passageObj[passages[i].title] = passages[i];
        if(passages[i].links.length === 0) {
            if(knownDeadEnds.includes(passages[i].title)) {
                //Skip things like StoryTitle...
                continue;
            } else if(passages[i].tags.some(r=> validDeadEndTags.includes(r))) {
                //Skip passages the user told us to...
                continue;
            }
            deadEnds.push(passages[i]);
        }
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
            links[passages[i].links[j].passage] = passages[i];
        }
    }
    //Now go back through all the links and check to make sure they point somewhere...
    for(const link in links) {
        if(passageObj[link] === undefined) {
            errors.push('Passage "'+link+'" is missing! Referenced from '+links[link].filename);
        }
    }
    if(errors.length === 0) {
        console.log('No errors found!');
    } else {
        console.log('Errors:');
        for(let i = 0; i < errors.length; i++) {
            console.log('    '+errors[i]);
        }
    }
    if(deadEnds.length === 0) {
        console.log('No dead end passages found!');
    } else {
        console.log('Dead End Passages:');
        for(let i = 0; i < deadEnds.length; i++) {
            console.log('    '+deadEnds[i].title+' '+JSON.stringify(deadEnds[i].tags)+': '+deadEnds[i].filename);
        }
    }
});