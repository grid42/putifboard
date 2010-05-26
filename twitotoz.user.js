// ==UserScript==
// -*- mode: c; c-basic-offset: 8; -*-
//  * vim: noexpandtab sw=8 ts=8 sts=0:
// @name           twitotoz.user.js 
// @namespace      http://renardjb.free.fr
// @description    Bring Totoz feature ton twitter - Version 4
// @include        http://twitter.com/*
// @include        http://www.twitter.com/*
// @include        https://twitter.com/*
// @include        https://www.twitter.com/*
//
// Contact : pqcc (AT) free.fr
// ==/UserScript==

// Changelog :  http://pqcc.free.fr/news/index.php?TwiTotoz

//--- Section "DEFINE CONST" ---
const VERSION = '4';
const DEFAULT_TOTOZSRV = 'http://sfw.totoz.eu/';
const HOME_URL = 'http://pqcc.free.fr/news/';
//--- End Section  ---

// Le popup des totoz
var GlobalPopup = document.createElement('div');
GlobalPopup.style.display = 'none';
GlobalPopup.setAttribute('class','popup');
GlobalPopup.innerHTML ="<div></div>";
//--- End Section  ---

/* ajout des events listeners */
window.addEventListener('load', function(event) { return onLoad(); }, true);
window.addEventListener('mouseover', function(event) { return onMouseOver(event); }, true);

function onMouseOver(event)
{
	target = event.target;
        name = target.nodeName.toLowerCase();
        targetClass = target.getAttribute('class');
        targetId = target.getAttribute('id');
	if (targetClass=='totoz') {
		totoz = target.textContent;
		totoz = totoz.substring(2, totoz.length - 1);
		GlobalPopup.innerHTML ="<div><img src='" +DEFAULT_TOTOZSRV+ totoz + ".gif' alt='TOTOZ'></diV";
		GlobalPopup.style.display = '';
		GlobalPopup.style.top = event.clientY + 15 + 'px';
		GlobalPopup.style.left= event.clientX + 15 + 'px';

	} else {
		GlobalPopup.style.display = 'none';
	}
}

function rewriteTotoz()
{
        var exp = /\[\:([^\t\)\]]+)\]/g;
        var allTotozMsg = evalexp('//span[@class=\'entry-content\']');
        for (var i = 0; i < allTotozMsg.snapshotLength; i++)
        {
                oneTotozMsg = allTotozMsg.snapshotItem(i);
                oneTotozMsg.innerHTML = oneTotozMsg.innerHTML.replace(exp, '<span class="totoz" id="$1">[:$1]</span>')
        }
        allTotozMsg = evalexp('//span[@id=\'latest_text\']');
        for (var i = 0; i < allTotozMsg.snapshotLength; i++)
        {
                oneTotozMsg = allTotozMsg.snapshotItem(i);
                oneTotozMsg.innerHTML = oneTotozMsg.innerHTML.replace(exp, '<span class="totoz" id="$1">[:$1]</span>')
        }
}

function evalexp(expression) {
        return document.evaluate(expression, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
}

function onLoad()
{
	document.getElementById('timeline_heading').appendChild(GlobalPopup);

	// AddCss
	var head, style;
        head = document.getElementsByTagName('head')[0];
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = ".totoz { color: red} div.popup {position:fixed;z-index:99;}";
        head.appendChild(style);

	// On traite les totoz
        rewriteTotoz();
}

