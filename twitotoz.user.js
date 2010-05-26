// ==UserScript==
// -*- mode: c; c-basic-offset: 8; -*-
//  * vim: noexpandtab sw=8 ts=8 sts=0:
// @name           twitotoz.user.js 
// @namespace      http://renardjb.free.fr
// @description    Bring Totoz feature ton twitter - Version 3
// @include        http://twitter.com/*
// @include        http://www.twitter.com/*
// @include        https://twitter.com/*
// @include        https://www.twitter.com/*
//
// Contact : pqcc (AT) free.fr
// ==/UserScript==

// Changelog :  http://pqcc.free.fr/news/index.php?TwiTotoz

//--- Section "DEFINE CONST" ---
const VERSION = '3';
const DEFAULT_TOTOZ = 'popup' ;
const DEFAULT_TOTOZSRV = 'http://totoz.eu/';
const HOME_URL = 'http://pqcc.free.fr/news/';
//--- End Section  ---

// Contient le cache des totoz
var GlobalArrayTotoz = new Array();
// Le popup des totoz
var GlobalPopup = document.createElement('div');
GlobalPopup.style.display = 'none';
GlobalPopup.setAttribute('class','popup');
GlobalPopup.innerHTML ="<div><img src='" + DEFAULT_TOTOZSRV + "totoz.gif'></diV";
GlobalPopup.style.display = '';

/* Get a pointer to the main content container in the page */
//const GlobalBoardIndex = evalexp('//div[@id=\'container\']').snapshotItem(0);

var GlobalClickTimer = -1;
var GlobalRefreshTimerId=0;
//--- End Section  ---

/* ajout des events listeners */
window.addEventListener('load', function(event) { return onLoad(); }, true);
window.addEventListener('mouseover', function(event) { return onMouseOver(event); }, true);
//window.addEventListener('mouseout', function(event) { GlobalPopup.style.display = 'none'; }, true);

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
		_log( GlobalPopup.innerHTML);
		GlobalPopup.style.display = '';
		GlobalPopup.style.top = event.clientY +5+ 'px';
		GlobalPopup.style.left= event.clientX+5 + 'px';

	} else {
		GlobalPopup.style.display = 'none';
	}
}


function rewriteMessage(message)
{
    message = stringToTotoz(message);
    return message;
}

function hello() { alert('hello'); }

function rewriteTotoz()
{
        var allTotozMsg = evalexp('//span[@class=\'entry-content\']');
        for (var i = 0; i < allTotozMsg.snapshotLength; i++)
        {
                oneTotozMsg = allTotozMsg.snapshotItem(i);
                oneTotozMsg.innerHTML = stringToTotoz(oneTotozMsg.innerHTML);
        }
        var allTotozMsg = evalexp('//span[@id=\'latest_text\']');
        for (var i = 0; i < allTotozMsg.snapshotLength; i++)
        {
                oneTotozMsg = allTotozMsg.snapshotItem(i);
                oneTotozMsg.innerHTML = stringToTotoz(oneTotozMsg.innerHTML);
        }
	
}


// Section "OnLoadEvent"
function addCSS()
{
	var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = ".totoz { color: red} div.popup {position:fixed;z-index:99;}";
        head.appendChild(style);
}

function initRefresh()
{
	window.clearInterval(currentIntervalId);
        GlobalRefreshTimerId = window.setInterval(refreshSlip,1000);
}

/* utils functions */
function contains(value)
{
        for(var i = 0; i < this.length ; i++) {
                if(this[i] == value)
                        return true;
        }
        return false;
}

Array.prototype.contains = contains;

// retourne la position left et top d'un élément
function findPos(obj) {
        var curleft = curtop = 0;
        if (obj.offsetParent) {
                curleft = obj.offsetLeft
                curtop = obj.offsetTop
                while (obj = obj.offsetParent) {
                        curleft += obj.offsetLeft
                        curtop += obj.offsetTop
                }
        }
        return [curleft,curtop];
}

function addTotoz(totoz)
{
        if(!GlobalArrayTotoz.contains(totoz)) {
                GlobalArrayTotoz.push(totoz);
                var img = document.getElementById('totozImg[' + totoz + ']');
                if(!img) {
                        img = document.createElement('img');
                        img.style.display = 'none';
                        img.setAttribute('src',GM_getValue('dlfp.totozsrv') + totoz + '.gif');
                        img.setAttribute('class','totoz');
                        img.setAttribute('id','totozImg[' + totoz + ']');
                        
                        document.getElementsByTagName('body')[0].appendChild(img);
                }
        }
}

function showTotoz(totoz, x, y)
{
        var element = document.getElementById('totozImg[' + totoz + ']');
        element.style.top = (y + 10 + document.documentElement.scrollTop) + 'px';
        element.style.left = x + 'px';
        element.style.visibility = 'hidden';
        element.style.display = '';
        var final_y = y + 10 + element.clientHeight;
        if(final_y > window.innerHeight && GM_getValue('dlfp.reverse') == HAUT_EN_BAS) {
                element.style.top = y + document.documentElement.scrollTop - 10 - element.clientHeight + 'px';
        }
        element.style.visibility = '';
}

// Fonction simplifiée par Chrisix
function stringToTotoz(message)
{
        var exp = /\[\:([^\t\)\]]+)\]/g;
        return message.replace(exp, '<span class="totoz" id="$1">[:$1]</span>');
        //return message.replace(exp, '<img src="' + DEFAULT_TOTOZSRV + '$1.gif" />');
}

function _log(msg) {
        GM_log(msg);
}

function evalexp(expression) {
        return document.evaluate(expression, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
}

function onLoad()
{
	_log('load');
	GlobalBoardIndex =document.getElementById('timeline_heading');// evalexp('//body').snapshotItem(0);
	GlobalBoardIndex.appendChild(GlobalPopup);

        addCSS();
        rewriteTotoz();
        //initRefresh();
	_log('end load');
}
