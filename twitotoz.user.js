// ==UserScript==
// -*- mode: c; c-basic-offset: 8; -*-
//  * vim: noexpandtab sw=8 ts=8 sts=0:
// @name           twitotoz.user.js 
// @namespace      http://renardjb.free.fr
// @description    Bring Totoz feature on twitter - Version 5
// @include        http://twitter.com/*
// @include        http://www.twitter.com/*
// @include        https://twitter.com/*
// @include        https://www.twitter.com/*
//
// Contact : pqcc (AT) free.fr
// ==/UserScript==

// Changelog :  http://pqcc.free.fr/news/index.php?TwiTotoz

const TOTOZSRV = 'http://sfw.totoz.eu/';

var g_Popup = document.createElement('div');
g_Popup.style.display = 'none';
g_Popup.setAttribute('class','popup');
g_Popup.innerHTML ="<div></div>";

window.addEventListener('load', function(event) { 
	document.getElementById('timeline_heading').appendChild(g_Popup);

	var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = ".totoz { color: red} div.popup {position:fixed;z-index:99;}";
        document.getElementsByTagName('head')[0].appendChild(style);

        var exp = /\[\:([^\t\)\]]+)\]/g;
        var spans = document.evaluate('//span', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0; i < spans.snapshotLength; i++) {
                item = spans.snapshotItem(i);
                item.innerHTML = item.innerHTML.replace(exp, '[:<span class="totoz">$1</span>]')
        }
}, true);

window.addEventListener('mouseover', function(event) { 
	if (event.target.getAttribute('class') == 'totoz') {
		url = TOTOZSRV + event.target.textContent + ".gif" 
		g_Popup.innerHTML = "<div><img src='" + url + " alt='TOTOZ'></diV";
		g_Popup.style.top = event.clientY + 15 + 'px';
		g_Popup.style.left = event.clientX + 15 + 'px';
		g_Popup.style.display = '';
	} else {
		g_Popup.style.display = 'none';
	}
}, true);
