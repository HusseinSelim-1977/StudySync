// Polyfill TextEncoder/TextDecoder for jsdom in older Node versions
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
