/**
 * Convert ANSI escape codes to HTML
 * @param {*} text 
 * @returns 
 */
const convertAnsiToHtml = (text) => {
    // Console color codes
    const colorCodes = {
        cyan    : '[36m',
        green   : '[32m',
        grey    : '[2m',
        red     : '[31m',
        white   : '[0m',
        yellow  : '[33m'
    };

    const codesToStyles = Object.entries(colorCodes).reduce((acc, [color, code]) => {
        acc[code] = `color: ${color};`;
        return acc;
    }, {});

    let htmlText = text;

    // Replace ANSI escape codes with HTML styles
    Object.entries(codesToStyles).forEach(([code, style]) => {
        const escapedCode = code.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regex = new RegExp(escapedCode, 'g');
        htmlText = htmlText.replace(regex, `<span style="${style}">`);
    });

    return htmlText;
};