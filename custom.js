//This handles includes
exports.includeLinkParser = (str, links) => {
    let linkStrings = str.match(/<<include [^>>]+>>/gm);
    if(linkStrings !== null) {
        for(let i = 0; i < linkStrings.length; i++) {
            let linkString = linkStrings[i];
            let link = linkString.substr(10).slice(0, -2);
            if(link[0] === '"') {
                link = link.substr(1).slice(0, -1);
            }
            links.push({text: 'Include '+i, passage: link});
        }
    }
    return links;
}

//This handles a custom macro I have for doing RPG style fights
exports.battleLinkParser = (str, links) => {
    let linkStrings = str.match(/<<battle [^>>]+>>/gm);
    if(linkStrings !== null) {
        for(let i = 0; i < linkStrings.length; i++) {
            let linkString = linkStrings[i];
            let matches = linkString.match(/\"([^"]+)"/g);
            let winLink = matches[0].substr(2).slice(0, -2);
            let loseLink = matches[1].substr(2).slice(0, -2);
            links.push({text: 'Battle Win Link', passage: winLink.split('|')[1]});
            links.push({text: 'Battle Lose Link', passage: loseLink.split('|')[1]});
        }
    }
    return links;
}

exports.all = [
    exports.includeLinkParser,
    exports.battleLinkParser
];