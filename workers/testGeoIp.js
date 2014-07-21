geoip = require('geoip-lite');


var ip = '107.155.187.154';

var geo = geoip.lookup(ip);

console.log(geo);
console.log(geo.ll[1]);