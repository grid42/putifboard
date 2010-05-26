// ==UserScript==
// -*- mode: c; c-basic-offset: 8; -*-
//  * vim: noexpandtab sw=8 ts=8 sts=0:
// @name           twitotoz.user.js 
// @namespace      http://renardjb.free.fr
// @description    Bring Totoz feature ton twitter - Version 1
// @include        http://twitter.com/*
// @include        http://www.twitter.com/*
// @include        https://twitter.com/*
// @include        https://www.twitter.com/*
//
// Contact : pqcc (AT) free.fr
// ==/UserScript==

// Changelog :  http://pqcc.free.fr/news/index.php?TwiTotoz

//--- Section "DEFINE CONST" ---
const VERSION = '1';
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
                        _log("event press " + eventType + " target " + target);
                        onKeyPress(event);
                        break;
                case 'keyup':
                        _log("event " + eventType + " target " + target);
                        //onKeyUp(event);
                        break;
                case 'keydown':
                        _log("event " + eventType + " target " + target);
                        onKeyDown(event);
                        break;
                case 'change':
                        _log("event " + eventType + " target " + target);
                        onChange(event);
                        break;
                case 'focus':
                        _log("event " + eventType + " target " + target);
                        onFocus(event);
                        break;
                case 'mousedown':
                case 'mouseup':
                        _log("event " + eventType + " target " + target);
                        break;
                case 'mousemove':
                        break;
                case 'blur':
                        _log("event " + eventType + " target " + target);
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

function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(
                                nameEQ.length,c.length);
        }
        return null;
}

function createCookie(name,value,days) {
        if (days) {
                var date = new Date();
                date.setTime(date.getTime()+(days*24*60*60*1000));
                var expires = "; expires="+date.toGMTString();
        }
        else { var expires = "" };
        document.cookie = name+"="+value+expires+"; path=/";
}

function quickSetCookie(name,value)
{
        createCookie(name,value);
}

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
}

function onMouseOver(event)
{
        if (GlobalKeyModeInProgress) {
                GlobalKeyModeInProgress=false;
                var allDivs = evalexp('//div[contains(@class,\'highlighted\')]');
                for (var i = 0; i < allDivs.snapshotLength; i++) {
                        unhighlight(allDivs.snapshotItem(i));
                }
                allDivs = evalexp('//span[contains(@class,\'highlighted\')]');
                for (var i = 0; i < allDivs.snapshotLength; i++) {
                        unhighlight(allDivs.snapshotItem(i));
                }
        }
        GlobalPopup.style.display='none';
        GlobalPopup.innerHTML='';
        
        target = event.target;
        name = target.nodeName.toLowerCase();
        targetClass = getClass(target);
        targetId = getId(target);
        
        switch(name) {
                case 'span':
                        switch(targetClass) {
                                case 'totoz':
                                        addTotoz(targetId);
                                        showTotoz(targetId, event.clientX, event.clientY);
                                        break;
                                case 'horloge':
                                case 'horloge myPost':
                                        highlightPointedHorloge(targetId);
                                        break;
                        }
                        break ;
                case 'b':
                        if(target.parentNode.nodeName.toLowerCase() == 'div' && getClass(target.parentNode).match('boardleftmsg') ) {
                                highlightLeftHorloge(getId(target.parentNode));
                                highlightPointingTo(getId(target.parentNode));
                        } else if(target.parentNode.nodeName.toLowerCase() == 'span' && getClass(target.parentNode).match('bigorno')) {
                                highlightLeftHorloge(getId(target.parentNode.parentNode));
                                highlightPointingTo(getId(target.parentNode.parentNode));
                        }
                        break;
        }
}

function onMouseOut(event)
{
        target = event.target;
        name = target.nodeName.toLowerCase();
        targetClass = getClass(target);
        targetId = getId(target);
        switch(name) {
                case 'span':
                        switch(targetClass) {
                                case 'totoz':
                                        document.getElementById('totozImg[' + targetId + ']').style.display = 'none';
                                        break;
                                case 'horloge highlighted':
                                case 'horloge myPost highlighted':
                                        unhighlightPointedHorloge(targetId);
                                        break;
                        }
                        break;
                case 'b':
                        if(target.parentNode.nodeName.toLowerCase() == 'div' && getClass(target.parentNode).match('boardleftmsg')) {
                                unhighlightPointingTo(getId(target.parentNode));
                                unhighlightLeftHorloge(getId(target.parentNode));
                        } else if(target.parentNode.nodeName.toLowerCase() == 'span' && getClass(target.parentNode).match('bigorno')) {
                                unhighlightPointingTo(getId(target.parentNode.parentNode));
                                unhighlightLeftHorloge(getId(target.parentNode.parentNode));
                        }
                        break;
        }
}

//Section "Traitement de texte"
function appendTextToMessage(text,pos)
{
        var msgBox = document.getElementById('message');
        if (pos) {
                insertTextAtCursor(msgBox, text, pos); 
        } else {
                insertTextAtCursor(msgBox, text, text.length); 
        }
}

function insertTextAtCursor(element, snippet, newPosition)
{
        if(!newPosition)
                newPosition = snippet.length;
        var selectionEnd = element.selectionStart + newPosition;
        element.value = element.value.substring(0, element.selectionStart) + snippet +
                        element.value.substring(element.selectionEnd, element.value.length);
        element.focus();
        element.setSelectionRange(selectionEnd, selectionEnd);
}

function onKeyPress(event)
{
        if(event.ctrlKey) {
                if (event.keyCode==38 || event.keyCode == 40) {
                                GlobalKeyModeInProgress = true;
                                queryLeft = '//div[starts-with(@class,\'boardleftmsg\') and contains(@class,\'highlighted\')]';
                                var allLeftDiv = evalexp(queryLeft);
                                if (allLeftDiv.snapshotLength!=0) {
                                        for (var i = 0; i < allLeftDiv.snapshotLength; i++) {
                                                leftDiv = allLeftDiv.snapshotItem(i);
                                                unhighlightPointedHorloge(leftDiv.id);
                                                if (event.keyCode==38) {
                                                        if (leftDiv.previousSibling.previousSibling.id) {
                                                                leftDiv=leftDiv.previousSibling.previousSibling;
                                                        }
                                                } else {
                                                        if (leftDiv.nextSibling.nextSibling.nextSibling.id) {
                                                                leftDiv=leftDiv.nextSibling.nextSibling.nextSibling;
                                                        }
                                                }
                                        }
                                } else {
                                        // on recherche le premier post
                                        queryLeft = '//div[starts-with(@class,\'boardleftmsg\')]';
                                        allLeftDiv = evalexp(queryLeft);

                                        sens = GM_getValue('dlfp.reverse'); 
                                        if (sens != HAUT_EN_BAS) {
                                                leftDiv = allLeftDiv.snapshotItem(0);
                                        } else {
                                                leftDiv = allLeftDiv.snapshotItem(allLeftDiv.snapshotLength-1);
                                        }
                                }
                                if(leftDiv != null) {
                                        leftDiv.focus();
                                        _log("doc" + document.documentElement.scrollTop);
                                        _log("div" + leftDiv.offsetTop );

                                        if (leftDiv.offsetTop <= document.documentElement.scrollTop+100) {
                                                document.documentElement.scrollTop-=100;
                                        }
                                        if (leftDiv.offsetTop >= document.documentElement.scrollTop+window.innerHeight-100) {
                                                document.documentElement.scrollTop+=100;
                                        }
                                        highlightPointedHorloge(leftDiv.id);
                                }

                                event.stopPropagation();
                                event.preventDefault();
                } else if(event.keyCode==13) {
                        GlobalKeyModeInProgress = true;
                        queryLeft = '//div[contains(@class,\'boardleftmsg\') and contains(@class,\'highlighted\')]';

                        var allLeftDiv = evalexp(queryLeft);
                        for (var i = 0; i < allLeftDiv.snapshotLength; i++) {
                                appendTextToMessage(allLeftDiv.snapshotItem(i).getElementsByTagName('b')[0].innerHTML);
                                appendTextToMessage(' ');
                        }
                        event.stopPropagation();
                        event.preventDefault();

                } else if(event.keyCode==36) { // Touche HOME
                        event.stopPropagation();
                        event.preventDefault();
                        queryLeft = '//div[contains(@class,\'boardrightmsg\') and contains(@class,\'highlighted\')]';

                        var allLeftDiv = evalexp(queryLeft);
                        for (var i = 0; i < allLeftDiv.snapshotLength; i++) {
                                collec = allLeftDiv.snapshotItem(i).getElementsByTagName('a');
                                for(var j in collec) {
                                        window.open(collec[j]);
                                }
                        }
                } else {
                        GM_log(event.keyCode);
                }
        }

}
function onKeyDown(event)
{
        if(event.target.id == 'message') {
                if(event.altKey) {
                        switch(event.keyCode) {
                                case 79:
                                        appendTextToMessage('_o/* <b>BLAM</b>! ');
                                        break;
                                case 77:
                                        appendTextToMessage('====> <b>Moment ' + getSelectedText() +'</b> <====', 16);
                                        break;
                                case 70:
                                        appendTextToMessage('#fortune ');
                                        GlobalIsFortuning = true;
                                        break;
                                case 66:
                                        appendTextToMessage('<b>' + getSelectedText()+'</b>', 3);
                                        break;
                                case 73:
                                        appendTextToMessage('<i>' + getSelectedText()+'</i>', 3);
                                        break;
                                case 85:
                                        appendTextToMessage('<u>' + getSelectedText()+'</u>', 3);
                                        break;
                                case 83:
                                        appendTextToMessage('<s>' + getSelectedText()+'</s>', 3);
                                        break;
                                case 80:
                                        appendTextToMessage('_o/* <b>paf!</b> ');
                                        break;
                                case 67:
                                        appendTextToMessage('\\o/ chauvounet \\o/');
                                        break;
                        }
                        switch(event.keyCode) {
                                case 79:
                                case 77:
                                case 70:
                                case 66:
                                case 73:
                                case 85:
                                case 83:
                                case 80:
                                case 67:
                                        event.stopPropagation();
                                        event.preventDefault();
                        }
                }
        } else if(!event.ctrlKey && !event.metaKey && ! event.altKey && (event.keyCode >= 65 && event.keyCode <= 90) || event.keyCode == 32) {
                /* autofocus */
                if(GlobalIsTyping == false)
                        document.getElementById('message').focus();  
        }
}
// Fin Section "Traitement de texte"

function onChange(event)
{
        if(event.target.id == 'uautorefresh') {
                GM_setValue('dlfp.autorefresh',!GM_getValue('dlfp.autorefresh'));
                window.location.reload();
        } else if(event.target.id == 'timeoutinput') {
                if(!isNaN(event.target.value)) {
                        GM_setValue('dlfp.timeout',event.target.value * 1000)
                        // initRefresh();
                        window.location.reload();
                } else {
                        event.target.value = GM_getValue('dlfp.timeout');
                }
        } else if(event.target.id == 'uforbiddenWord') {
                GM_setValue('dlfp.forbiddenwords', event.target.value);
                GlobalForbiddenWords = event.target.value.split('|');
                window.location.reload();
        } else if(event.target.id == 'uBakinput') {
                GM_setValue('dlfp.baklogins', event.target.value);
                GlobalBakLogins = event.target.value.split('|');
                window.location.reload();
        } else if(event.target.id == 'uainput') {
                GM_setValue('dlfp.ua', event.target.value);
        } else if(event.target.id == 'faviconinput') {
                GM_setValue('dlfp.favicon', event.target.value) ;
                favicon.change(GM_getValue('dlfp.favicon')) ;
        } else if(event.target.id == 'titleinput') {
                document.title = event.target.value;
                GM_setValue('dlfp.title', event.target.value);
        } else if(event.target.id == 'ubouletmode') {
                GM_setValue('dlfp.antibouletmode', event.target.value);
                window.location.reload();
        } else if(event.target.id == 'uchasse') {
                GM_setValue('dlfp.chasse', !GM_getValue('dlfp.chasse'));
                window.location.reload();
        } else if(event.target.id == 'umyalert') {
                GM_setValue('dlfp.myalert', !GM_getValue('dlfp.myalert'));
                window.location.reload();
        } else if(event.target.id == 'uinputfixed') {
                GM_setValue('dlfp.inputfixed', !GM_getValue('dlfp.inputfixed'));
                window.location.reload();
        } else if(event.target.id == 'ump3') {
                GM_setValue('dlfp.mp3', !GM_getValue('dlfp.mp3'));
                window.location.reload();
        } else if(event.target.id == 'utotozsrv') {
                GM_setValue('dlfp.totozsrv', event.target.value);
                window.location.reload();
        } else if(event.target.id == 'uclignotement') {
                GM_setValue('dlfp.clignotement', event.target.value);
        } else if(event.target.id == 'utotozmode') {
                GM_setValue('dlfp.totoz', event.target.value);
                window.location.reload();
        } else if(event.target.id == 'message') {
                // non traitée
        } else if(event.target.id == 'newRegexURL') {
                // non traitée
        } else if(event.target.id == 'newURL') {
        } else if(event.target.id == 'uTransforUrls') {
        } else {
                        alert("ERROR " + event.target.id);
        }
        GlobalIsTyping = false;
}

function onFocus(event)
{
        GlobalWindowFocus = true;
            postAlert();
        switch(event.target.id) {
                case 'timeoutinput':
                case 'uainput':
                case 'uBakinput':
                case 'uforbiddenWord':
                case 'titleinput':
                case 'faviconinput' :
                case 'utotozsrv':
                case 'newRegexURL':
                case 'newURL':
                        GlobalIsTyping = true;
                        break;
                case 'message':
                        if(document.getElementById('configZone').style.display == '')
                                document.getElementById('configZone').style.display = 'none';
                        break;
        }
}

function onClick(event)
{
        target = event.target;
        nodeName = target.nodeName.toLowerCase();
        nodeId = target.id;
        nodeClass = target.className;

        switch(nodeId) {
                case 'refresh':
                        if(!GlobalReverseInProgress) {
                                refreshSlip();
                        }
                        return true;
                case 'uUpdate':
                        window.location = 'http://pqcc.free.fr/news/share/minifilemanager/enhancedboard.user.js';
                        event.stopPropagation();
                        return true;
                case 'configZoneLink':
                        if(document.getElementById('configZone').style.display == '') {
                                document.getElementById('configZone').style.display = 'none';
                                document.getElementById('panel').style.width = PANEL_WIDTH + 'px';
                        } else {
                                document.getElementById('configZone').style.display = '';
                                document.getElementById('panel').style.width = '450px';
                        }
                        event.stopPropagation();
                        event.preventDefault();
                        return true;
                case 'sens':
                        if(!GlobalReverseInProgress) {
                                reverseTribune();
                        }
                        return true;
                case 'uAddTransforUrl':
                        addTransforUrl();
                        return true;
                case 'uSupTransforUrl':
                        removeTransforUrl();
                        return true;
                default:
        }
        switch(nodeName) {
                case 'span':
                        if(nodeClass.indexOf('horloge',0)!=-1) {
                                queryLeft = '//div[starts-with(@class,\'boardleftmsg\') and contains(@class,\'highlighted\')]';
                                var allLeftDiv = evalexp(queryLeft);
                                for (var i = 0; i < allLeftDiv.snapshotLength; i++) {
                                        sens = GM_getValue('dlfp.reverse');
                                        leftDiv= allLeftDiv.snapshotItem(0);
                                        event.preventDefault();
                                        event.stopPropagation();
                                        if(sens == HAUT_EN_BAS) {
                                                document.documentElement.scrollTop=leftDiv.offsetTop-30;
                                        } else {
                                                document.documentElement.scrollTop=leftDiv.offsetTop+30;
                                        }
                                        if(GlobalClickId != leftDiv.id) {
                                                GlobalPopup.style.display='none';
                                                GlobalPopup.innerHTML='';
                                                GlobalClickId = leftDiv.id;
                                                GlobalClickTimer = setInterval(highlightedClick,100);
                                        }
                                }
                        } else if(nodeClass.indexOf('canard',0)!=-1) {
                          if (target.parentNode.nodeName.toLowerCase() == 'div' &&
                              getClass(target.parentNode).match('boardrightmsg')) {
                                clockId = getId(target.parentNode);
                                horlogeToInsert = clockId.substring(0,8);
                                indice = parseInt(clockId.charAt(8));
                                exposant = '';
                                if(indice > 1 && indice < 4) {
                                        exposant = String.fromCharCode(176 + indice); 
                                } else if(indice > 3) {
                                        exposant = '^' + indice
                                } else {
                                        if(document.getElementById(horlogeToInsert + (indice + 1))) {
                                                exposant = String.fromCharCode(185);
                                        }
                                }
                                horlogeToInsert = horlogeToInsert + exposant;
                                appendTextToMessage(horlogeToInsert + ' pan ! pan ! ');
                          }
                        }
                        break;
                case 'div':
                        break;
                case 'input':
                        if(GlobalIsFortuning && GlobalIsFortuned) {
                                var element = document.getElementById('message');
                                var str = element.value;
                                str = str.substring(0, element.value.length - 1);
                                element.value = str;
                                GlobalIsFortuning = GlobalIsFortuned = false;
                                postToSlip(element);
                                return false;
                        }
                        break;
                case 'button':
                        break;
                case 'a':
                        break;
                case 'b':
                        if( (target.parentNode.nodeName.toLowerCase() == 'div' && 
                             getClass(target.parentNode).match('boardleftmsg'))
                                || 
                            (target.parentNode.nodeName.toLowerCase() == 'span' && 
                             getClass(target.parentNode) == 'bigorno') ) {
                                if(target.parentNode.nodeName.toLowerCase() == 'span' &&
                                   getClass(target.parentNode) == 'bigorno') {
                                        clockId = getId(target.parentNode.parentNode);
                                } else {
                                        clockId = getId(target.parentNode);
                                }
                                horlogeToInsert = clockId.substring(0,8);
                                indice = parseInt(clockId.charAt(8));
                                exposant = '';
                                if(indice > 1 && indice < 4) {
                                        exposant = String.fromCharCode(176 + indice); 
                                } else if(indice > 3) {
                                        exposant = '^' + indice
                                } else {
                                        // Existe-t-il un id = 1
                                        if(document.getElementById(horlogeToInsert + (indice + 1))) {
                                                exposant = String.fromCharCode(185);
                                        }
                                }
                                horlogeToInsert = horlogeToInsert + exposant;
                                if(GlobalIsFortuning) {
                                        appendTextToMessage(horlogeToInsert + ',');
                                        GlobalIsFortuned = true;
                                } else {
                                        appendTextToMessage(horlogeToInsert + ' ');
                                }
                                event.stopPropagation();
                                event.preventDefault();
                        }
                        break;
                break;
        }
}

/* Highlighting functions */
function highlight(element){addClass(element, 'highlighted');}
function unhighlight(element){removeClass(element, 'highlighted');}

function highlightPointedHorloge(id)
{
        // On cherche les horloges dont l'id commence par l'id parametre
        queryLeft = '//div[starts-with(@class,\'boardleftmsg\') and starts-with(attribute::id, \'' + id + '\')]';
        queryRight = '//div[starts-with(@class,\'boardrightmsg\') and starts-with(attribute::id, \'' + id + '\')]';

        var allLeftDiv = evalexp(queryLeft);
        var allRightDiv = evalexp(queryRight);

        for (var i = 0; i < allLeftDiv.snapshotLength; i++) {
                leftDiv = allLeftDiv.snapshotItem(i);
                rightDiv = allRightDiv.snapshotItem(i); 
                highlight(leftDiv);
                highlight(rightDiv);
                yPosition = findPos(leftDiv);
                yPost = yPosition[1];
                
                yScreen = document.documentElement.scrollTop;
                showPopup = false;
                if(GM_getValue('dlfp.reverse') == HAUT_EN_BAS) {
                        if(yPost < yScreen) {
                                showPopup = true;                                        
                        }
                } else {
                        if(yPost > yScreen + window.innerHeight) {
                                showPopup = true;
                        }
                }
                if(showPopup) {
                        leftClone = leftDiv.cloneNode(true);
                        rightClone = rightDiv.cloneNode(true);
                        for (node in leftClone.getElementsByTagName('span')) {
                                node.onmouseover = node.onmouseout = null;
                        }
                        for (node in rightClone.getElementsByTagName('span')) {
                                node.onmouseover = node.onmouseout = null;
                        }
                        spacerClone = rightDiv.nextSibling.cloneNode(true);
                        GlobalPopup.innerHTML='';
                        GlobalPopup.appendChild(leftClone);
                        GlobalPopup.appendChild(rightClone);
                        GlobalPopup.appendChild(spacerClone);
                        if(GM_getValue('dlfp.reverse') == HAUT_EN_BAS) {
                                GlobalPopup.style.top = (60 + yScreen) + 'px';
                        } else {
                                GlobalPopup.style.top = (yScreen + window.innerHeight - 60 ) + 'px'; 
                        }
                        GlobalPopup.style.display = '';
                        showPopup = false;
                }
        }
        highlightPointingTo(id);
}

function unhighlightPointedHorloge(id)
{
        queryLeft = '//div[starts-with(attribute::class,\'boardleftmsg\') and starts-with(attribute::id, \'' + id + '\')]';
        queryRight = '//div[starts-with(attribute::class,\'boardrightmsg\') and starts-with(attribute::id, \'' + id + '\')]';

        var allLeftDiv = evalexp(queryLeft);
        var allRightDiv = evalexp(queryRight);
        for (var i = 0; i < allLeftDiv.snapshotLength; i++) {
                leftDiv = allLeftDiv.snapshotItem(i);
                unhighlight(leftDiv);
                unhighlight(allRightDiv.snapshotItem(i));
                
                yPosition = findPos(leftDiv);
                yPost = yPosition[1];
        
                yScreen = document.documentElement.scrollTop;

                
                hidePopup = false;
                if(GM_getValue('dlfp.reverse') == HAUT_EN_BAS) {
                        if(yPost < yScreen) {
                                hidePopup = true;                                        
                        }
                } else {
                        if(yPost > yScreen + window.innerHeight) {
                                hidePopup = true;
                        }
                }
                if(hidePopup) {
                        GlobalPopup.style.display = 'none';
                        GlobalPopup.innerHTML = '';
                }
        }
        unhighlightPointingTo(id);
}

function highlightPointingTo(id)
{
        query = '//span[starts-with(@class,\'horloge\') and starts-with(\'' + id + '\',attribute::id )]';
        var allHorloges = evalexp(query);
        for (var i = 0; i < allHorloges.snapshotLength; i++) {
                highlight(allHorloges.snapshotItem(i));
        }
}

function unhighlightPointingTo(id)
{
        query = '//span[starts-with(@class,\'horloge\') and starts-with(\'' + id + '\',attribute::id )]';
        var allHorloges = evalexp(query);
        for (var i = 0; i < allHorloges.snapshotLength; i++) {
                unhighlight(allHorloges.snapshotItem(i));
        }
}

function highlightLeftHorloge(id)
{
        queryLeft = '//div[starts-with(@class,\'boardleftmsg\') and starts-with(attribute::id, \'' + id + '\')]';
        var allLeftDiv = evalexp(queryLeft);
        for (var i = 0; i < allLeftDiv.snapshotLength; i++) {
                highlight(allLeftDiv.snapshotItem(i));
        }
}

function unhighlightLeftHorloge(id)
{
        queryLeft = '//div[starts-with(@class,\'boardleftmsg\') and starts-with(attribute::id, \'' + id + '\')]';
        var allLeftDiv = evalexp(queryLeft);
        for (var i = 0; i < allLeftDiv.snapshotLength; i++) {
                unhighlight(allLeftDiv.snapshotItem(i));
        }
}

/* slip GET & POST functions */
function refreshSlip()
{
        if(!GlobalReverseInProgress) {
                window.clearInterval(GlobalRefreshTimerId);
                GlobalTimer.style.display='';

                document.getElementById('sens').style.color = 'gray';
                document.getElementById('refresh').style.color = 'gray';
                GM_xmlhttpRequest( {
                        method: 'GET',
                        url: getUrl,
                        overrideMimeType: 'text/xml',
                        headers: {
                                'User-agent': DEFAULT_UA_SMALL,
                                'Accept': 'text/xml',
                                'Cache-Control': 'no-cache, must-revalidate'
                        },
                        onreadystatechange: function (e){slipProgress(e);},
                        onerror: function (e){slipError(e);},
                        onload: function (e){slipLoaded(e);}
                });
        } else {
                _log('refreshSlipdoublons');
        }
}

function slipProgress(event){};
function slipError(event){
        GlobalTimer.style.display='none';
        initRefresh();
};

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
