(window.webpackJsonp=window.webpackJsonp||[]).push([[1],{42:function(n,t,e){"use strict";e.r(t),e.d(t,"getApproveToken",(function(){return a})),e.d(t,"approve",(function(){return r})),e.d(t,"pwreset",(function(){return s})),e.d(t,"recover",(function(){return i})),e.d(t,"register",(function(){return u})),e.d(t,"login",(function(){return o})),e.d(t,"logout",(function(){return c})),e.d(t,"getLogs",(function(){return f})),e.d(t,"getUsers",(function(){return l})),e.d(t,"getLog",(function(){return h})),e.d(t,"getRoutes",(function(){return d})),e.d(t,"getCCD",(function(){return p})),e.d(t,"putCCD",(function(){return v})),e.d(t,"getConf",(function(){return g})),e.d(t,"setConf",(function(){return m})),e.d(t,"startVpn",(function(){return y})),e.d(t,"stopVpn",(function(){return j}));var o=function(n,t,e){var o={password:t};n.includes("@")?o.email=n:o.name=n,fetch("/user/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}).then((function(n){n.status<400&&e&&n.json().then(e)}))},c=function(n,t){fetch("/user/logout?vtoken=".concat(n)).then((function(n){n.status<400&&t&&n.json().then(t)}))},u=function(n,t,e,o){fetch("/user/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:n,name:t,password:e})}).then((function(n){n.status<400&&o&&n.json().then(o)}))},i=function(n,t){fetch("/user/recover?".concat(n.includes("@")?"email":"name","=").concat(n)).then((function(n){n.status<400&&t&&n.json().then(t)}))},s=function(n,t,o,c){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(e){fetch("/user/pwreset",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"vtoken ".concat(t),body:e.encrypt({password:n},o)}}).then((function(n){n.status<400&&c&&n.json().then(c)}))}))},r=function(n,t){fetch("/user/approve?vtoken=".concat(n)).then((function(n){n.status<400&&t&&n.json().then(t)}))},a=function(n,t,o,c){fetch("/user/approvetoken?vtoken=".concat(t,"&uid=").concat(n)).then((function(n){n.status<400&&c&&n.json().then((function(n){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(t){var e=t.decrypt;c(e(n.message,o,n.iv))}))}))}))},f=function(n,t,o){fetch("/user/logs?vtoken=".concat(n)).then((function(n){n.status<400&&o&&n.json().then((function(n){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(e){var c=e.decrypt;o(JSON.parse(c(n.message,t,n.iv)))}))}))}))},h=function(n,t,o,c){fetch("/user/logs?vtoken=".concat(t,"&files=").concat(n)).then((function(n){n.status<400&&c&&n.json().then((function(n){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(t){var e=t.decrypt;c(JSON.parse(e(n.message,o,n.iv)))}))}))}))},l=function(n,t,o){fetch("/user?vtoken=".concat(n)).then((function(n){n.status<400&&o&&n.json().then((function(n){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(e){var c=e.decrypt;o(JSON.parse(c(n.message,t,n.iv)))}))}))}))},d=function(n,t,o){fetch("/routes?vtoken=".concat(n)).then((function(n){n.status<400&&o&&n.json().then((function(n){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(e){var c=e.decrypt;o(JSON.parse(c(n.message,t,n.iv)))}))}))}))},p=function(n,t,o,c){console.log(c),fetch("/routes/ccd?vtoken=".concat(n).concat(null!=c?"&uid="+c:"")).then((function(n){n.status<400&&o&&n.json().then((function(n){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(e){var c=e.decrypt;o(JSON.parse(c(n.message,t,n.iv)))}))}))}))},v=function(n,t,o,c,u){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(e){var i=e.encrypt;fetch("/routes/ccd",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"vtoken ".concat(t)},body:JSON.stringify(i({ccd:n,uid:u},o))}).then((function(n){n.status<400&&c&&n.json().then(c)}))}))},g=function(n,t,o){fetch("/routes/conf?vtoken=".concat(n)).then((function(n){n.status<400&&o&&n.json((function(n){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(e){var c=e.decrypt;o(c(n.message,t,n.iv))}))}))}))},m=function(n,t,o,c){Promise.all([e.e(0),e.e(2),e.e(3)]).then(e.t.bind(null,40,7)).then((function(e){var u=e.encrypt;fetch("/routes/conf",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"vtoken ".concat(t)},body:JSON.stringify(u(n,o))}).then(c)}))},y=function(n,t){fetch("/routes/vpn?vtoken=".concat(n,"&start=1")).then((function(n){n>399?n.json().then(t):t(null)}))},j=function(n,t){fetch("/routes/vpn?vtoken=".concat(n,"&stop=1")).then(t)}}}]);