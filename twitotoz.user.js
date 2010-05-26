// ==UserScript==
// -*- mode: c; c-basic-offset: 8; -*-
//  * vim: noexpandtab sw=8 ts=8 sts=0:
// @name           twitotoz.user.js 
// @namespace      http://renardjb.free.fr
// @description    Bring Totoz feature ton twitter - Version 2
// @include        http://twitter.com/*
// @include        http://www.twitter.com/*
// @include        https://twitter.com/*
// @include        https://www.twitter.com/*
//
// Contact : pqcc (AT) free.fr
// ==/UserScript==

// Changelog :  http://pqcc.free.fr/news/index.php?TwiTotoz

//--- Section "DEFINE CONST" ---
const VERSION = '2';
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

var GlobalTimer = document.createElement('div');
GlobalTimer.setAttribute('class','timer');
GlobalTimer.setAttribute('id','timer');
GlobalTimer.style.display='none';

/* Get a pointer to the main content container in the page */
const GlobalBoardIndex = evalexp('//div[@id=\'container\']').snapshotItem(0);
GlobalBoardIndex.appendChild(GlobalPopup);
GlobalBoardIndex.appendChild(GlobalTimer);

var GlobalClickTimer = -1;
var GlobalRefreshTimerId=0;
//--- End Section  ---

/* ajout des events listeners */
global_events = ['load','blur','click','submit','mouseover','mouseout',
                 'mousemove','mousedown','mouseup','keyup','keydown',
                 'keypress', 'change','focus','dblclick','scroll'];
for(evt in global_events) {
        window.addEventListener(global_events[evt],
                        function(event) { return manageEvent(event); }, true);
}
delete global_events;



// Section "OnLoadEvent"
function addCSS()
{
        addGlobalStyle( '');
}

function initRefresh()
{
	window.clearInterval(currentIntervalId);
        GlobalRefreshTimerId = window.setInterval(refreshSlip,1000);
}

function manageEvent(event)
{
        eventType = event.type;
        target = event.target;
        switch(eventType) {
                case 'load':
                        _log("event " + eventType + " target " + target);
                        onLoad();
                        break;
                case 'click':
                        _log("event " + eventType + " target " + target);
                        onClick(event);
                        break;
                case 'submit':
                        _log("event " + eventType + " target " + target);
                        onSubmit(target);
                        event.stopPropagation();
                        event.preventDefault();
                        return false;
                case 'mouseover':
                        onMouseOver(event);
                        break;
                case 'mouseout':
                        onMouseOut(event);
                        break;
                case 'scroll':
                        break;
                case 'keypress':
                        break;
                case 'keyup':
                        break;
                case 'keydown':
                        break;
                case 'change':
                        _log("event " + eventType + " target " + target);
                        onChange(event);
                        break;
                case 'focus':
                        _log("event " + eventType + " target " + target);
                        break;
                case 'mousedown':
                case 'mouseup':
                        _log("event " + eventType + " target " + target);
                        break;
                case 'mousemove':
                        break;
                case 'blur':
                        if (target == window || target == document) {
                                GlobalWindowFocus = false;
                        }
                        break;
                default:
                        _log("DEF event " + eventType + "target " + target);
                        break;
        }
}

function stringToWiki(message)
{
  var index1 = message.indexOf("[[",0);
  if (index1 != -1 ) {
     var exp = new RegExp('\\[\\[(.*)\\]\\]', 'gi');
     return message.replace(exp, '<a href="http://fr.wikipedia.org/wiki/$1">$1</a>');
  }  else   {
    return message;
  }        
}

function rewriteMessage(message)
{
    // On réecrit les leçons, les totoz, les horloges, les urls et les canards
    message = stringToWiki(message);
    message = stringToTotoz(message);
    return message;
}

function rewriteTotoz()
{
        var allTotozMsg = evalexp('//div[@class=\'entry-content\']');
        for (var i = 0; i < allTotozMsg.snapshotLength; i++)
        {
                oneTotozMsg = allTotozMsg.snapshotItem(i);
                oneTotozMsg.innerHTML = stringToTotoz(oneTotozMsg.innerHTML);
        }
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


/* HTML functions*/
function getId(element)
{
        if(element.hasAttribute('id'))
                return element.getAttribute('id');
        return null;
}

function setId(element, newId)
{
        element.setAttribute('id', newId);
}

function setClass(element, newClass)
{
        element.setAttribute('class', newClass);
}

function getClass(element)
{
        return element.getAttribute('class');
}

function addClass(element,newClass)
{
        theClass = element.getAttribute('class');
        if(!theClass.match(newClass)) {
                theClass = theClass + ' ' + newClass;
        }
        element.setAttribute('class', theClass);
}

function removeClass(element, oldClass)
{
        var exp_sp_before = new RegExp('( ' + oldClass + ')', 'g');
        var exp_sp_after = new RegExp('(' + oldClass + ' )', 'g');
        /* une des classes de l'élément, sauf la premiere */
        if(exp_sp_before.test(getClass(element))) {
                setClass(element, getClass(element).replace(' '+ oldClass, ''));
        } else if(exp_sp_after.test(getClass(element))) {
                setClass(element, getClass(element).replace(''+ oldClass, ' '));
        } else if(oldClass == getClass(element)) {
                setClass(element,'') ;
        }
}

function addGlobalStyle(css)
{
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
}


function onLoad()
{
	_log('load');
        addCSS();
        rewriteTotoz();
        initRefresh();
	_log('end load');
}
function onMouseOut() {
}
function onMouseOver() {
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
        if(GM_getValue('dlfp.totoz') == 'popup') {
            return message.replace(exp, '<span class="totoz" id="$1">[:$1]</span>');
        } else {
            return message.replace(exp, '<img src="' + GM_getValue('dlfp.totozsrv') + '$1.gif" />');
        }
}

function _log(msg) {
        GM_log(msg);
}

function evalexp(expression) {
        return document.evaluate(expression, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
}
