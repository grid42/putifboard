// ==UserScript==
// -*- mode: c; c-basic-offset: 8; -*-
//  * vim: expandtab sw=8 ts=8 sts=0:
// @name           enhancedBoard
// @namespace      http://www.linuxfr.org
// @description    Bring Web 2.0 features to LinuxFr - Version 2010.05.02
// @include        http://linuxfr.org/board
// @include        http://linuxfr.org/board/*
// @include        http://www.linuxfr.org/board
// @include        http://www.linuxfr.org/board/*
// @include        https://linuxfr.org/board
// @include        https://linuxfr.org/board/*
// @include        https://www.linuxfr.org/board
// @include        https://www.linuxfr.org/board/*
//
// Contact : pqcc free.fr
// ==/UserScript==

// Changelog :  http://pqcc.free.fr/news/index.php?Putifboard

// Enable log
GM_setValue('dlfp.debug',0);

//--- Section "DEFINE CONST" ---
const BRANCH = 'dev'
const VERSION = '2010.05.02';
const DEFAULT_UA_SMALL = 'EnhancedBoard';
const DEFAULT_UA = DEFAULT_UA_SMALL + '/' + VERSION;
const DEFAULT_AUTOREFRESH = true;
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_ANTIBOULETMODE = 'nedflan' ;
const DEFAULT_FAVICON = 'http://hadoken.free.fr/enhancedboard.ico' ;
const DEFAULT_PANEL_TOP = 0 ;
const DEFAULT_PANEL_LEFT = 0 ;
const DEFAULT_CHASSE = true;
const DEFAULT_TOTOZ = 'popup' ;
const DEFAULT_BAKLOGINS = 'Single|pendu' ;
const DEFAULT_FORBIDDENWORDS = 'pendu|BLOUBIBOULGA';
const DEFAULT_TITLE = 'DLFP: board';
const DEFAULT_TOTOZSRV = 'http://totoz.eu/';
const DEFAULT_CLIGNOTEMENT = 'clignotement';
const DEFAULT_MYALERT = false;
const DEFAULT_INPUTFIXED = true;
const DEFAULT_MP3 = false;
const HOME_URL = 'http://pqcc.free.fr/news/';
const HOME_SCRIPT = 'http://github.com/grid42/putifboard/raw/' + BRANCH + '/enhancedboard.user.js';
const PANEL_WIDTH = 20;
const DEFAULT_GLOBALSTRANSFORURLS = [
  ['\w*(jpg)$','IMG'],
  ['\w*(png)$','IMG'],
  ['^https?://(www\.)?linuxfr\.org','DLFP'],
  ['^http://(www\.)?google\.(fr|com)','Google'],
  ['^http://(www\.)?lemonde\.(fr|com)','Le Monde'],
  ['^http://(www\.)?youtube','YouTube'],
  ['^http://(www\.)?dailymotion','DailyMotion'],
  ['^http://(www\.)?whatthemovie','wtm'],
  ['^http://(www\.)?20minutes','20m'],
  ['^http://(www\.)?lefigaro','fig'],
  ['^http://.*yahoo','Ya']
];

//--- End Section  ---

//--- Define VARIABLES GLOBALE Section ---
/* Variables used when using the alt+f shortcut to create a fortune */
var GlobalIsFortuning = false;
var GlobalIsFortuned = false;
// Used to memorize the last post Id.
var GlobalLastId = 0;
var GlobalNbLastId = 0;
// Ajout du focus
var GlobalWindowFocus = true; //document.hasFocus();
var GlobalAlert = false;
// Used to memorize onLoad state. Set under onload event. 
// Unset after the first refreshslip
var GlobalFirstLoad = 0;
// Indique qu'on est en cours de saisie ailleurs que dans l'input message.
var GlobalIsTyping = false;
// Deux variables d'états. C'est assez Gruik comme approche
var GlobalKeyModeInProgress = false;
// Contient le cache des totoz
var GlobalArrayTotoz = new Array();
// Permet de définir les personnes indésirables (séparé par '|')
var GlobalBakLogins = new Array();
// Liste de mots séparés par '|' qui transforme un post en IsBoulet
var GlobalForbiddenWords = new Array();
// Liste des transformations d'url
var GlobalsTransforUrls= new Array();
// Le popup des totoz
var GlobalPopup = document.createElement('div');
GlobalPopup.style.display = 'none';
GlobalPopup.setAttribute('class','popup');

var GlobalTimer = document.createElement('div');
GlobalTimer.setAttribute('class','timer');
GlobalTimer.setAttribute('id','timer');
GlobalTimer.style.display='none';

var GlobalConfigTabId = 0;

// Lapin compris
var previousHorloge = '';
var currentHorlogeNumber = 1;
/* Get a pointer to the main content container in the page */
const GlobalBoardIndex = evalexp('//div[@class=\'boardindex\']').snapshotItem(0);
GlobalBoardIndex.appendChild(GlobalPopup);
GlobalBoardIndex.appendChild(GlobalTimer);

var GlobalClickTimer = -1;
var GlobalClickId='00:00:001';

var GlobalRefreshTimerId=0;
//--- End Section  ---

const favicon = {
        change: function(iconURL, optionalDocTitle)
        {
                if (optionalDocTitle) { document.title = optionalDocTitle; }
                this.addLink(iconURL, true);
        },
        
        addLink: function(iconURL)
        {
                var link = document.createElement("link");
                link.type = "image/x-icon";
                link.rel = "shortcut icon";
                link.href = iconURL;
                this.removeLinkIfExists();
                this.docHead.appendChild(link);
        },
        removeLinkIfExists: function()
        {
                var links = this.docHead.getElementsByTagName("link");
                for (var i=0; i<links.length; i++) {
                        var link = links[i];
                        if (link.type=="image/x-icon" &&
                                               link.rel=="shortcut icon") {
                                this.docHead.removeChild(link);
                                return; // Assuming only one match at most.
                        }
                }
        },
        docHead:document.getElementsByTagName("head")[0]
}

/* Define default settings */
global_variables = ['totoz','autorefresh','timeout', 
                 'antibouletmode','favicon','panel_top',
                 'panel_left','chasse','baklogins',
                 'forbiddenwords', 'title', 'totozsrv', 
                 'clignotement','myalert','inputfixed', 'mp3'] ;
for(i in global_variables) {
        if(GM_getValue('dlfp.' + global_variables[i]) == null) {
                value = eval(('DEFAULT_' + global_variables[i]).toUpperCase());
                GM_setValue('dlfp.' + global_variables[i], value);
        }
}
delete global_variables;

/* Define default settings serializer */
global_variables = ['GlobalsTransforUrls'] ;
for(i in global_variables) {
 if(GM_getValue('dlfp.' + global_variables[i]) == null) {
            value = eval(('DEFAULT_' + global_variables[i]).toUpperCase());
            GM_setValue('dlfp.' + global_variables[i], serialize(value));
 }
 GlobalsTransforUrls=unserialize(GM_getValue('dlfp.' + global_variables[i]));
}
delete global_variables;

/* ajout des events listeners */
global_events = ['load','blur','click','submit','mouseover','mouseout',
                 'mousemove','mousedown','mouseup','keyup','keydown',
                 'keypress', 'change','focus','dblclick','scroll'];
for(evt in global_events) {
        window.addEventListener(global_events[evt],
                        function(event) { return manageEvent(event); }, true);
}
delete global_events;

/* custom init of the default UA */
var current_ua = GM_getValue('dlfp.ua') ;
if(current_ua != null) {
        var exp_ua = new RegExp('EnhancedBoard/[0-9]+.[0-9]+.[0-9]+');
        GM_setValue('dlfp.ua',current_ua.replace(exp_ua,DEFAULT_UA));
} else {
        GM_setValue('dlfp.ua', DEFAULT_UA);
}
/* and favicon */
favicon.change(GM_getValue('dlfp.favicon'),GM_getValue('dlfp.title')) ;

/* global variables */
var postUrl = 'http://linuxfr.org/board/add.html';
var getUrl = 'http://linuxfr.org/board/remote.xml';
if (readCookie('https')=='1') {
        postUrl = 'https://linuxfr.org/board/add.html';
        getUrl = 'https://linuxfr.org/board/remote.xml';
}

// Section "OnLoadEvent"
function addCSS()
{
        addGlobalStyle( '.main {' +
                        'background-color:#ededdb!important;' +
                        'margin:0!important;' +
                        'padding:0!important;' +
                        '}' +
                        'input.onsubmit:focus {' +
                        'color:gray;' +
                        '}' +
                        'img.totoz {' +
                        'position:absolute;' +
                        '}' +
                        'span.totoz {' +
                        'color:#0A1;' +
                        'font-weight:700;' +
                        '}' +
                        'span.totoz:hover {' +
                        'color:#080;' +
                        'font-weight:700;' +
                        '}' +
                        'span.canard {' +
                        'color:#93C;' +
                        'font-weight:700;' +
                        '}' +
                        'span.horloge {' +
                        'color:#00D;' +
                        'padding-left:1px;' +
                        'padding-right:1px;' +
                        'border:1px solid transparent;' +
                        '}' +
                        'div.myPost,span.myPost {' +
                        'color:#C00;' +
                        'font-weight:700;' +
                        '}' +
                        '.myPost a {' +
                        'color:#C00!important;' +
                        'font-weight:700;' +
                        '}' +
                        '.bigorno {' +
                        'border:1px solid red;' +
                        'border-bottom:1px solid red;' +
                        '}' +
                        '.boardleftmsg {' +
                        'color:#000;' +
                        'width:14%;' +
                        'border-top:1px solid transparent;' +
                        'border-bottom:1px solid transparent;' +
                        'border:1px solid transparent;' +
                        '}' +
                        '.boardrightmsg {' +
                        'color:#000;' +
                        'border-top:1px solid transparent;' +
                        'border-bottom:1px solid transparent;' +
                        '}' +
                        '.boardindex {' +
                        'background-color:#ededdb;' +
                        'margin:0 0 2em;' +
                        'padding:0;' +
                        '}' +
                        'button {' +
                        'width:150px;' +
                        'margin-top:3px;' +
                        'margin-bottom:3px;' +
                        'border:1px solid #FFF;' +
                        'background-color:#FFF;' +
                        '}' +
                        '.panel {' +
                        'position:fixed;' +
                        'top:5em;' +
                        'left:0;' +
                        'background-color:lightgray;' +
                        'opacity:0.9;' +
                        'text-align:center;' +
                        'border:1px solid gray;' +
                        'margin:0;' +
                        'padding:2px;' +
                        '}' +
                        'div.panelLinks {' +
                        'z-index:99;' +
                        'width:100%;' +
                        'border:0 solid #000;' +
                        'text-align:right;' +
                        'vertical-align:top;' +
                        '}' +
                        'table.subpanel {' +
                        'width:100%;' +
                        'text-align:center;' +
                        'margin:2px auto;' +
                        '}' +
                        'td.subpanel {' +
                        'text-align:left;' +
                        '}' +
                        'td.subpanelcenter {' +
                        'text-align:center;' +
                        '}' +
                        'a.refreshlink,a.refreshlink:hover,a.refreshlink:active,a.refreshlink:focus {' +
                        'font-weight:bolder;' +
                        'border:none;' +
                        'text-decoration:none;' +
                        '}' +
                        'a.configZoneLink {' +
                        'font-weight:bolder;' +
                        'font-size:10px;' +
                        'color:#006;' +
                        '}' +
                        'a:hover {' +
                        'color:#008;' +
                        '}' +
                        'a:link,a:visited,a:focus,a:active {' +
                        'color:#306;' +
                        '}' +
                        'a#on:link,a#on:hover,a#on:active,a#on:visited,a#on:focus {' +
                        'color:#69F;' +
                        '}' +
                        'a#off:link,a#off:hover,a#off:active,a#off:visited,a#off:focus {' +
                        'color:#FF9;' +
                        '}' +
                        'input#timeoutinput {' +
                        'border:1px solid gray;' +
                        'width:2em;' +
                        'text-align:center;' +
                        'padding:0;' +
                        '}' +
                        'input#uainput,input#titleinput,input#faviconinput {' +
                        'border:1px solid gray;' +
                        'width:15em;' +
                        'text-align:left;' +
                        'padding:0;' +
                        '}' +
                        'div.timer {' +
                        'position:fixed;' +
                        'bottom:0%; height:15px;right:0px;width:15px;' +
                        'font-size:0.5em;' +
                        'background-color: darkred;' +
                        'z-index:199;' +
                        '}' +
                        'div.popup {' +
                        'background-image:url(http://hadoken.free.fr/jaune.gif);' +
                        'font-size:130%;' +
                        'border:2px solid orange;' +
                        'position:absolute;' +
                        'width:95%;' +
                        'left:30px;' +
                        '}' +
                        '.highlighted {' +
                        'background-color:#FFD202;' +
                        'background-image:url(http://hadoken.free.fr/jaune.gif);' +
                        'border-top:1px solid #FA0;' +
                        'border-bottom:1px solid #FA0;' +
                        '}' +
                        'span.highlighted {' +
                        'background-color:#FFD202!important;' +
                        'border:1px solid #FA0;' +
                        'padding:1px 1px 0;' +
                        '}' +
                        '.smallmenubar,.lsfnbanner,.menusearch,.boulet {' +
                        'display:none;' +
                        '}' +
                        'ul, li{' +
                        'list-style: none;' +
                        '}' +
                        '.myConfigTabs{' +
                        'float: left;' +
                        'padding: 2px 10px;' +
                        'margin-right: 5px;' +
                        'color: #333;' +
                        'background: #C4C4C2;' +
                        'border: 1px solid #B3B3B1;' +
                        'cursor: pointer;' +
                        'margin-bottom: -1px;' +
                        '} ' +
                        '.myConfigTabs:hover{' +
                        'background: #D5D5D3;' +
                        '} ' +
                        '.myConfigTabs_selected{' +
                        'float: left;' +
                        'padding: 2px 10px;' +
                        'margin-right: 5px;' +
                        'color: #333;' +
                        'background: #D5D5D3;' +
                        'border-top: 1px solid #B3B3B1;' +
                        'border-right: 1px solid #B3B3B1;' +
                        'border-left: 1px solid #B3B3B1; ' +
                        'cursor: pointer; ' +
                        'margin-bottom: -1px;' +
                        '}     ' +
                        '.clear{' +
                        'clear: both;' +
                        '}' +
                        '.mon_contenu{' +
                        'padding: 10px;    ' +
                        '}');

                        if (GM_getValue('dlfp.inputfixed')==true) {
                                addGlobalStyle('.menubar {' +
                                'position:fixed;' +
                                'top:0;' +
                                'left:0;' +
                                'width:100%;' +
                                '}' );
                        }
}

// Call this function once on onLoad Event
function onLoadGetMessages()
{
        lastLeftQuery = '//div[@class=\'boardindex\']/'+
                'div[starts-with(@class,\'boardleftmsg\') and position() = 2]';
        lastRightQuery = '//div[@class=\'boardindex\']/'+
                'div[starts-with(@class,\'boardrightmsg\') and position() = 3]';
        lastLeftDiv = evalexp(lastLeftQuery).snapshotItem(0);
        lastRightDiv = evalexp(lastRightQuery).snapshotItem(0);
        lastLogin = lastLeftDiv.getElementsByTagName('a')[0].textContent;
        lastHorloge = lastLeftDiv.getElementsByTagName('b')[0].textContent;
        lastInfo = lastLeftDiv.getAttribute('title');
        lastMessageFull = lastRightDiv.innerHTML;
        lastMessage = lastMessageFull.substring(11);
        lastMessage = lastMessage.substring(0,lastMessage.length - 1);
        allLeftDiv = evalexp('//div[@class=\'boardleftmsg\']');
        allRightDiv = evalexp('//div[@class=\'boardrightmsg\']');
        
        same = 1;
        i = 0;
        nb = 0;
        while(same || i < allLeftDiv.snapshotLength) {
                leftDiv = allLeftDiv.snapshotItem(i);
                rightDiv = allRightDiv.snapshotItem(i);
                login = leftDiv.getElementsByTagName('a')[0].textContent;
                horloge = leftDiv.getElementsByTagName('b')[0].textContent;
                info = leftDiv.getAttribute('title');
                messageFull = rightDiv.innerHTML;
                i++;
                if(login == lastLogin &&
                   horloge == lastHorloge &&
                   messageFull == lastMessageFull && info == lastInfo) {
                        nb++;
                } else {
                        same = 0;
                }
        }
        GlobalNbLastId = nb;
}

// Vérifie si le post est un post indésirable
// La valeur de retour est différente de zéro si le post doit être filtré
function isBoulet(login, message) {
        var tete = '([o0Oô°øòó@]|(&ocirc;)|(&deg;)|(&oslash;)|(&ograve;)|(&oacute;))';
        var bak_re = new RegExp('(\\\\_' + tete + '&lt;)|(&gt;' +
                                tete +
                                '_\\/)|(coin ?! ?coin ?!)|(pan ?! pan ?!)', '');
        GlobalForbiddenWords = GM_getValue('dlfp.forbiddenwords').split('|');
        for (var i = 0; i < GlobalForbiddenWords.length; i++) {
            if ( message.search(GlobalForbiddenWords[i])!=-1) {
                    return (1);
            }
        }
        GlobalBakLogins = GM_getValue('dlfp.baklogins').split('|');
        if (GlobalBakLogins.contains(login)) return -2;
        return (message.match(bak_re)); //'pan ! pan !'));
}

function BoulayTransformator(left, rightDiv) 
{
        if(GM_getValue('dlfp.antibouletmode') == 'nedflan') {
                var sentences = new Array("je suis un gros boulet",
                                          "je suis lourd",
                                          "je suis chauve",
                                          "je suis un gros abruti",
                                          "je suis une saucisse",
                                          "je pue des pieds",
                                          "j'ai des bords",
                                          "prout",
                                          "pika",
                                          "plop");
                var s = sentences[Math.floor(Math.random()*sentences.length)];
                while (rightDiv.innerHTML != (rightDiv.innerHTML = rightDiv.innerHTML.replace(/<[^<>]*>/g, "")));
                        rightDiv.innerHTML = '<i style="color:#aaa" title="MESSAGE:' + rightDiv.innerHTML + '"><b>-</b> '+s+'</i>';
        } else if(GM_getValue('dlfp.antibouletmode') == 'putifuto') {
                addClass(leftDiv, 'boulet') ;
                addClass(rightDiv, 'boulet') ;
        } else if(GM_getValue('dlfp.antibouletmode') == 'chrisix') {
                rightDiv.style.color = "#aaa"; 
        }
}

function UrlTransformator(leftDiv, rightDiv)
{
        urls = rightDiv.getElementsByTagName('a');
        var regURL = new RegExp('^https?://(www\.)?linuxfr.org');
        for (i=0; i<urls.length;i++) {
                urls[i].setAttribute('target','_blank');
                if(regURL.test(urls[i].getAttribute('href'))) {
                        if (readCookie('https')=='1') {
                                urls[i].protocol="https:";
                        } else {
                                urls[i].protocol="http:";
                        }
                }
                if(urls[i].innerHTML.indexOf('[url]')>0) {
                        var txtURL = "";
                        if(urls[i].getAttribute('href')) {
                                for(j=0; j<GlobalsTransforUrls.length;j++) {
                                        var regURL2 = new RegExp(GlobalsTransforUrls[j][0]);
                                        if(regURL2.test(urls[i].getAttribute('href'))) {
                                                txtURL += (txtURL==""?'':'-')+GlobalsTransforUrls[j][1];
                                        }
                                }
                                        urls[i].innerHTML = (txtURL==""?'<b>[url]</b>':'<b>['+txtURL+']</b>');
                        }
                }
        }
}

// Fonction de réécriture de la ligne.
// C'est beau, c'est gruik, c'est de la bouilli
function rewriteDivs(leftDiv, rightDiv)
{
        href = leftDiv.getElementsByTagName('a')[0];
        login = href.textContent;

        leftDiv.setAttribute('login', login);
        leftDiv.setAttribute('style','margin-top:0;margin-bottom:0;width:160px;');
        
        horloge = leftDiv.getElementsByTagName('b')[0].textContent;
        if(horloge == previousHorloge) {
                currentHorlogeNumber++;
        } else {
                currentHorlogeNumber = 1;
                previousHorloge = horloge;
        }
        if(login == readCookie('login')) {
                addClass(leftDiv,'myPost');
        }
        setId(leftDiv, horloge + currentHorlogeNumber);
        setId(rightDiv, horloge + currentHorlogeNumber);

        // Rewrite the right div
        rightDiv.setAttribute('login', login);
        rightDiv.setAttribute('style', 'margin-top: 0;margin-bottom: 0;');
        rightDiv.innerHTML = rewriteMessage(rightDiv.innerHTML);
        
        if (isBoulet(leftDiv.getElementsByTagName('a')[0].textContent,
                                rightDiv.innerHTML) &&
                        !GM_getValue('dlfp.chasse')) {
                BoulayTransformator(leftDiv, rightDiv);
        } else {
                UrlTransformator(leftDiv, rightDiv);
                var exp_login = new RegExp('(' + readCookie('login') + '&lt;)', 'g');
                var exp_moules = new RegExp('(moules&lt;)', 'g');
                if(exp_login.test(rightDiv.innerHTML) ||
                   exp_moules.test(rightDiv.innerHTML)) {
                        leftDiv.innerHTML = '<span class="bigorno">' + 
                                leftDiv.innerHTML + '</span>';
                        rightDiv.innerHTML = '<span class="bigorno">' +
                                rightDiv.innerHTML + '</span>'; 
                        postAlert();
                }
                if (GM_getValue('dlfp.myalert')!=true) { 
                        postAlert();
                } else {
                        if(rightDiv.innerHTML.indexOf('myPost')!=-1) {
                                postAlert();
                        }
                }
        }
}


function initRefresh()
{
        if(GM_getValue('dlfp.autorefresh')) {
                currentIntervalId = GM_getValue('dlfp.intervalId'); 
                if(currentIntervalId) {
                        window.clearInterval(currentIntervalId);
                }
                GlobalRefreshTimerId = window.setInterval(refreshSlip,
                                                 GM_getValue('dlfp.timeout'));
                GM_setValue('dlfp.intervalId', GlobalRefreshTimerId);
        }
}
function reversePosts()
{
                var allDiv = evalexp('//div[@class=\'boardindex\']/div[starts-with(@class, \'boardleftmsg\') or starts-with(@class, \'boardrightmsg\') or starts-with(@style,\'clear\')]');
                lastDiv = allDiv.snapshotItem(allDiv.snapshotLength - 1);
                firstDiv = allDiv.snapshotItem(0);
                
                for (var i = 0; i < allDiv.snapshotLength; i+=3) {
                        leftDiv = allDiv.snapshotItem(i);
                        rightDiv = allDiv.snapshotItem(i+1);
                        styleDiv = allDiv.snapshotItem(i+2);
                        
                        lastDiv.parentNode.insertBefore(leftDiv,lastDiv);
                        lastDiv.parentNode.insertBefore(rightDiv,lastDiv);
                        lastDiv.parentNode.insertBefore(styleDiv,lastDiv);
                        lastDiv = leftDiv;
                }
                form = evalexp('//form[@action=\'../board/add.html\']').snapshotItem(0);
                br = evalexp('//div[@class=\'boardindex\']/br[position()=1]').snapshotItem(0);
                panel = document.getElementById('panel');
                
                GlobalBoardIndex.appendChild(form);
                window.location = '#bottom';
}

function addTransforUrl()
{
  if (document.getElementById('newRegexURL').value=="" || document.getElementById('newURL').value=="") {
    _log("addTransforUrl Boulet !!!");
  } else {
    var a = [[document.getElementById('newRegexURL').value,document.getElementById('newURL').value]];
    GlobalsTransforUrls=GlobalsTransforUrls.concat(a);
    GM_setValue('dlfp.GlobalsTransforUrls',serialize(GlobalsTransforUrls));
    window.location.reload();
  }
}

function removeTransforUrl()
{
  var result = new Array();
  for (elemId in GlobalsTransforUrls) {
    if (document.getElementById('uTransforUrls').value != GlobalsTransforUrls[elemId] && elemId != 'contains' ) {
      result=result.concat([GlobalsTransforUrls[elemId]]);
    }
  }
  GlobalsTransforUrls=result;  
  GM_setValue('dlfp.GlobalsTransforUrls',serialize(GlobalsTransforUrls));
  window.location.reload();
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


// Patch de Triton, inspiré de stringToTotoz ci-dessous, légèrement simplifié par Chrisix
function stringToCanard(message)
{
    var tete = '([o0ô°øòó@]|(&ocirc;)|(&deg;)|(&oslash;)|(&ograve;)|(&oacute;))'
    var exp1 = new RegExp('(\\\\_' + tete + '&lt;)', 'gi');
    var exp2 = new RegExp('(&gt;' + tete + '_\\/)', 'gi');
    var exp3 = new RegExp('(coin ?! ?coin ?!)', 'gi');
    var newMessage = message.replace(exp1, '<span class="canard">$1</span>');
    newMessage = newMessage.replace(exp2, '<span class="canard">$1</span>');
    newMessage = newMessage.replace(exp3, '<span class="canard">$1</span>');
    return newMessage;
}

// Patch de chrisix, inspiré du patch de Triton ci-dessus, inspiré de stringToTotoz ci-dessous
// Patché par zragg et grid
function stringToLecon(message)
{
  var index1 = message.indexOf("<a ",0);
  var exp = new RegExp('([lL]e([cç]|&ccedil;|&Ccedil;)on[ ]*([0-9]+))', 'gi');
  if ( exp.test(message) )
  {
    if (index1 != -1)
    {
      var _message = message.substring(0,index1).replace(exp, '<a href="http://lecons.ssz.fr/lecon/$3/">$1</a>');
      var index2 = message.indexOf("</a>",index1);
      if (index2 != -1)
      {
        _message = _message + message.substring(index1,index2+4);
        _message = _message + stringToLecon(message.substring(index2+4,message.length));
        return _message;
      }
    }
    else
    {
      return message.replace(exp, '<a href="http://lecons.ssz.fr/lecon/$3/">$1</a>');
    }
  }
  else
  {
    return message;
  }
}

// Corrige le bug DLFP sur les wikiliens
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
    message = stringToLecon(message);
    message = stringToWiki(message);
    message = stringToTotoz(message);
    message = stringToHorloge(message);
    message = stringToCanard(message);
    return message;
}

function rewriteTotoz()
{
        var allTotozMsg = evalexp('//div[@class=\'boardrightmsg\']');
        for (var i = 0; i < allTotozMsg.snapshotLength; i++)
        {
                oneTotozMsg = allTotozMsg.snapshotItem(i);
                oneTotozMsg.innerHTML = stringToTotoz(oneTotozMsg.innerHTML);
        }
}

// Réecriture complête des horloges
// Utilité : inconnue
function rewriteHorloges()
{
        // On récupère les couples de div et on les réecrit
        var allLeftDivs = evalexp('//div[starts-with(@class,\'boardleftmsg\')]');
        var allRightDivs = evalexp('//div[starts-with(@class,\'boardrightmsg\')]');
        for (var i = 0; i < allLeftDivs.snapshotLength; i++) {
                rewriteDivs(allLeftDivs.snapshotItem(i),
                            allRightDivs.snapshotItem(i));
        }
}

function addBottomLink()
{
        bottom = document.createElement('a');
        bottom.setAttribute('name','bottom');
        GlobalBoardIndex.parentNode.insertBefore(bottom,
                        GlobalBoardIndex.nextSibling);
}

//this function clean the page on loading
function cleanPage()
{
        var css = evalexp('//link[@type="text/css"]');
        var i = 0;
        while(i < css.snapshotLength) {
                //alert(css.snapshotItem(i));
//                css.snapshotItem(i).parentNode.removeChild(
//                                css.snapshotItem(i++));
                i++;
        }

        var elements = evalexp("//div[@class='boardindex']/p[position()>1]");
        i = 0;
        while(i < elements.snapshotLength) {
                elements.snapshotItem(i).parentNode.removeChild(
                                elements.snapshotItem(i++));
        }
        var aTrucs = evalexp("//a[@href='#' and text() = 'Activer les trucs jolis']").snapshotItem(0);
        aTrucs.parentNode.removeChild(aTrucs);
        var footer = evalexp("//div[@class = 'footer']").snapshotItem(0);
        footer.parentNode.removeChild(footer);
        elements = evalexp("//div[@class='boardindex']/p[position()<2]");
        elements.snapshotItem(0).innerHTML='';
}
function addOnglet(label) {
        GlobalConfigTabId +=1;
        element = document.createElement('li');
        element.id="o_" + GlobalConfigTabId;
        if (GlobalConfigTabId == 1) {
          element.setAttribute('class','myConfigTabs_selected');
        } else {
          element.setAttribute('class','myConfigTabs');
        }
        element.setAttribute('onclick','changeOnglet(this);');
        element.innerHTML=label;
        return element;
}
function addToolbarIcon(tool_id, img_src, img_title) {
        element = document.createElement('img');
        element.setAttribute('id',tool_id);
        element.setAttribute('src',img_src);
        element.setAttribute('title',img_title);
        return element;
}
function addToolbarButton(but_id, txt) {
        tr_el = document.createElement('tr');
        tr_el.setAttribute('class','subpanel');
        
        td_el = document.createElement('td');
        td_el.setAttribute('class','subpanelcenter');
        td_el.setAttribute('colspan','2');
        but = document.createElement('button');
        but.setAttribute('id',but_id);
        but.setAttribute('name',but_id);
        but.setAttribute('value',txt);
        but.innerHTML=txt;
        td_el.appendChild(but);
        tr_el.appendChild(td_el);
        return tr_el;
}

function addToolbarList(c_id, tab){
        tr_el = document.createElement('tr');
        tr_el.setAttribute('class','subpanel');
        
        td_el = document.createElement('td');
        td_el.setAttribute('class','subpanel');
        td_el.setAttribute('colspan','2');

        but = document.createElement('select');
        but.setAttribute('id',c_id);
        but.setAttribute('size',20);

        for(i=0; i< tab.length; i++) {
                opt = document.createElement('option');
                opt.innerHTML=tab[i];
                but.appendChild(opt);
        }

        td_el.appendChild(but);
        
        but = document.createElement('button');
        but.setAttribute('id','uSupTransforUrl');
        but.setAttribute('name','uSupTransforUrl');
        but.setAttribute('value','Supprimer');
        but.innerHTML='Supprimer';
        td_el.appendChild(but);
        tr_el.appendChild(td_el);
        return tr_el
}

function addToolbarCheckBox(c_id, txt, val) {
        tr_el = document.createElement('tr');
        tr_el.setAttribute('class','subpanel');
        
        td_el = document.createElement('td');
        td_el.setAttribute('class','subpanel');
        td_el.innerHTML=txt;
        tr_el.appendChild(td_el);

        td_el = document.createElement('td');
        td_el.setAttribute('class','subpanel');

        but = document.createElement('input');
        but.setAttribute('id',c_id);
        but.setAttribute('type','checkbox');
        if (val==true) {
                but.setAttribute('checked','yes');
        }

        td_el.appendChild(but);
        tr_el.appendChild(td_el);
        return tr_el;
}

function addToolbarTextBox(c_id, txt, val, size) {
        tr_el = document.createElement('tr');
        tr_el.setAttribute('class','subpanel');
        
        td_el = document.createElement('td');
        td_el.setAttribute('class','subpanel');
        td_el.innerHTML=txt;
        tr_el.appendChild(td_el);

        td_el = document.createElement('td');
        td_el.setAttribute('class','subpanel');

        but = document.createElement('input');
        but.setAttribute('id',c_id);
        but.setAttribute('type','textbox');
        but.setAttribute('size',size);
        but.setAttribute('value',val);

        td_el.appendChild(but);
        tr_el.appendChild(td_el);
        return tr_el;
}

function addToolbarSelectBox(c_id, txt, tab, val, size) {
        tr_el = document.createElement('tr');
        tr_el.setAttribute('class','subpanel');
        
        td_el = document.createElement('td');
        td_el.setAttribute('class','subpanel');
        td_el.innerHTML=txt;
        tr_el.appendChild(td_el);

        td_el = document.createElement('td');
        td_el.setAttribute('class','subpanel');

        but = document.createElement('select');
        but.setAttribute('id',c_id);

        for(i=0; i< tab.length; i++) {
                opt = document.createElement('option');
                opt.innerHTML=tab[i];
                if (val==tab[i]) {
                        opt.setAttribute('selected','yes');
                }
                but.appendChild(opt);
        }

        td_el.appendChild(but);
        tr_el.appendChild(td_el);
        return tr_el;
}

function displayPanel()
{
        panel = document.getElementById('panel');
        panel.style.width = PANEL_WIDTH + 'px';
        panel.style.z_index=100;

        expandLink = document.createElement('div');
        expandLink.setAttribute('class','panelLinks');
        expandLink.setAttribute('id','panelLinks');

        expandLink.appendChild(addToolbarIcon('refresh',
                                'http://pycoincoin.free.fr/onlinecc/img/refreshall.png',
                                'Allons à la pêche aux trolls'));
        expandLink.appendChild(addToolbarIcon('configZoneLink',
                                'http://pycoincoin.free.fr/onlinecc/img/config.png',
                                'Configuration'));
        expandLink.appendChild(addToolbarIcon('uUpdate',
                                'http://pycoincoin.free.fr/onlinecc/img/parse.png',
                                'A moi les fritures'));
        hiddenPanel = document.createElement('div');
        hiddenPanel.setAttribute('id','configZone');
        hiddenPanel.style.display = 'none';
        ConfigsTabs = document.createElement('div');
        ConfigsTabs.id="ConfigsTabs";
        configTabMenu = document.createElement('ul');
        configTabMenu.appendChild(addOnglet('Configuration'));
        configTabMenu.appendChild(addOnglet('URL Transform'));
        ConfigsTabs.appendChild(configTabMenu);
        hiddenPanel.appendChild(ConfigsTabs);
        ContentItems = document.createElement('div');
        ContentItems.id="ContentItems";
        onglet1 = document.createElement('div');
        onglet1.id="co_1";
        onglet1.setAttribute('class','mon_contenu');
        panelOnglet1 = document.createElement('table');
        panelOnglet1.setAttribute('class','subpanel');
        panelOnglet1.setAttribute('id','configPanel');
        
        
        panelOnglet1.appendChild(addToolbarCheckBox('uautorefresh',
                                'Auto Refresh', 
                                GM_getValue('dlfp.autorefresh')));
        panelOnglet1.appendChild(addToolbarTextBox('timeoutinput',
                                'Déclencheur', 
                                GM_getValue('dlfp.timeout')/1000,3));
        panelOnglet1.appendChild(addToolbarTextBox('uainput',
                                'User-Agent', 
                                GM_getValue('dlfp.ua'),50));
        panelOnglet1.appendChild(addToolbarTextBox('uBakinput',
                                'BoitAkon', 
                                GM_getValue('dlfp.baklogins'),50));
        panelOnglet1.appendChild(addToolbarTextBox('uforbiddenWord',
                                'Mots censurés', 
                                GM_getValue('dlfp.forbiddenwords'),50));
        panelOnglet1.appendChild(addToolbarTextBox('titleinput',
                                'Titre', 
                                document.title,50));
        panelOnglet1.appendChild(addToolbarTextBox('faviconinput',
                                'Favicon', 
                                GM_getValue('dlfp.favicon'),50));
        panelOnglet1.appendChild(addToolbarCheckBox('uchasse',
                                'Chasse ouverte', 
                                GM_getValue('dlfp.chasse')));
        panelOnglet1.appendChild(addToolbarSelectBox('ubouletmode',
                                'Mode de filtrage', 
                                ['putifuto','nedflan','chrisix'], 
                                GM_getValue('dlfp.antibouletmode'),50));
        panelOnglet1.appendChild(addToolbarSelectBox('utotozmode',
                                'Totoz', 
                                ['popup','inline'], 
                                GM_getValue('dlfp.totoz'),50));
        panelOnglet1.appendChild(addToolbarTextBox('utotozsrv',
                                'Serveur totoz', 
                                GM_getValue('dlfp.totozsrv'),50));
        panelOnglet1.appendChild(addToolbarSelectBox('uclignotement',
                                'Alerte',
                                ['Inactif','Simple','Clignotement'], 
                                GM_getValue('dlfp.clignotement')));
        panelOnglet1.appendChild(addToolbarCheckBox('umyalert',
                                'Alertes égoïstes', 
                                GM_getValue('dlfp.myalert')));
        panelOnglet1.appendChild(addToolbarCheckBox('uinputfixed',
                                'Formulaire fixe', 
                                GM_getValue('dlfp.inputfixed')));
        panelOnglet1.appendChild(addToolbarCheckBox('ump3',
                                'Musique', 
                                GM_getValue('dlfp.mp3')));

        panelOnglet1.innerHTML += '<tr class="subpanel">'+
                '<td style="text-align:right;color:gray;top:3px;" '+
                'class="subpanel" colspan="2">'+
                'Current version : <a href="' + HOME_SCRIPT + '">' + 
                BRANCH + ' ' + VERSION + '</a></td></tr>';
        onglet1.appendChild(panelOnglet1);
        ContentItems.appendChild(onglet1);
        
        onglet2 = document.createElement('div');
        onglet2.id="co_2";
        onglet2.setAttribute('class','mon_contenu');
        onglet2.setAttribute('style','display: none;');
        panelOnglet2 = document.createElement('table');
        panelOnglet2.setAttribute('class','subpanel');
        panelOnglet2.setAttribute('id','urlTransform');
        panelOnglet2.appendChild(addToolbarTextBox('newRegexURL','Nouvelle RegEx','',50));
        panelOnglet2.appendChild(addToolbarTextBox('newURL','Tag','',50));
        panelOnglet2.appendChild(addToolbarButton('uAddTransforUrl','Ajouter la règle'));
        panelOnglet2.appendChild(addToolbarList('uTransforUrls',GlobalsTransforUrls));
        onglet2.appendChild(panelOnglet2);
        ContentItems.appendChild(onglet2);
        hiddenPanel.appendChild(ContentItems);
        panel.appendChild(expandLink);
        panel.appendChild(hiddenPanel);
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
function addGlobalScript()
{
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        element = document.createElement('script');
        element.setAttribute('type','text/javascript');
        element.innerHTML = 'function changeOnglet(_this){'+
        'var getOnglets  = document.getElementById("ConfigsTabs").getElementsByTagName("li");'+
        'for(var i = 0; i < getOnglets.length; i++){'+
        'if(getOnglets[i].id){'+
        'if(getOnglets[i].id == _this.id){'+
        'getOnglets[i].className = "myConfigTabs_selected";'+
        'document.getElementById("c" + _this.id).style.display    = "block";'+
        '}'+
        'else{'+
        'getOnglets[i].className = "myConfigTabs";'+
        'document.getElementById("c" + getOnglets[i].id).style.display  = "none";'+
        '}'+
        '}'+
        '}'+
        '}';
  head.appendChild(element);
}

/* events handling functions */
function onSubmit(target)
{
        _log("onSubmit");
        name = target.nodeName.toLowerCase();
        
        // Des fois le target c'est le form des fois c'est le input. bizarre.
        inputField = target;
        if(name != 'input')
                inputField = target.getElementsByTagName('input')[0];
        
        // On poste to ze remote slip troué
        postToSlip(inputField);
}

function onLoad()
{
        GlobalFirstLoad = 1; 
        // On désactive les trucs originels
        jsIsEnabled = readCookie('jssuxor');
        if(jsIsEnabled != 'true' ) {
                quickSetCookie('jssuxor','true');
                document.location = document.location;
        }
        cleanPage();
        addCSS();
        addGlobalScript();
        createCustomElements();
        displayPanel();
        onLoadGetMessages();
        addBottomLink();
        reversePosts();
        rewriteInput();
        // rewriteTotoz();
        rewriteHorloges();
        initRefresh();
}
function createCustomElements() {
        // create the panel settings
        var boardIndex = evalexp("//div[@class='boardindex']").snapshotItem(0);
        var rightPlace = document.getElementById('message').parentNode.parentNode;
        panel = document.createElement('div');
        setClass(panel, 'panel');
        setId(panel,'panel');
        boardIndex.insertBefore(panel,rightPlace.nextSibling);
}

// Customize the input form
function rewriteInput()
{
        var element = document.getElementById('message');
        element.setAttribute('size','550');
        element.setAttribute('maxlength','500');
        element.setAttribute('accesskey','i');
        element.style.width='80%';

        var bandeau = document.getElementById('bandeau');
        if(bandeau) {
                bandeau.parentNode.removeChild(bandeau);
        }

        if (GM_getValue('dlfp.inputfixed')==true) {
                element.style.position='fixed';
                        element.style.bottom='0.2em' //='96.5%';
                        document.getElementById('panel').style.top='2em';
                element.style.left='41px';
                element.parentNode.style.z_index='0';
                element.parentNode.style.padding='0px';
                element.parentNode.style.width='100%';
                element.parentNode.style.margin='0px';
                p= element.parentNode

                dv = document.createElement('div');
                dv.style.z_index='0';
                dv.setAttribute('id','bandeau');
                dv.setAttribute('class','menubar');
                dv.style.position='fixed';
                dv.style.width='100%';
                dv.style.left='0';
                        dv.style.top='auto';
                        dv.style.bottom='0';
                        dv.style.height='1.6em';
                p.parentNode.insertBefore(dv,p);

        } else {
                
        }
}

function stopMarseillaise() {
        mp3 = document.getElementById('mp3');
        if(mp3) {
                mp3.parentNode.removeClass(mp3);
        }
}
function playMarseillaise() {
        if (GM_getValue('dlfp.mp3')==true) {
                mp3 = document.getElementById('mp3');
                if(!mp3) { 
                        mp3 = document.createElement('div');
                        mp3.innerHTML="<object width='220' height='55'><param name='movie' value='http://www.deezer.com/embedded/small-widget-v2.swf?idSong=2630429&colorBackground=0x555552&textColor1=0xFFFFFF&colorVolume=0x39D1FD&autoplay=0'></param><embed src='http://www.deezer.com/embedded/small-widget-v2.swf?idSong=2630429&colorBackground=0x525252&textColor1=0xFFFFFF&colorVolume=0x39D1FD&autoplay=1' type='application/x-shockwave-flash' width='220' height='55'></embed></object><br><font size='1' color ='#000000'>D&eacute;couvrez <a href='http://www.deezer.com/fr/guns-n-roses.html'>Guns N' Roses</a>!</font>";
                        document.getElementsByTagName('body')[0].appendChild(mp3);
                }
        } else {
                stopMarseillaise();
        }
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

                                        leftDiv = allLeftDiv.snapshotItem(0);
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
                                case 85:
                                        appendTextToMessage('<u>' + getSelectedText()+'</u>', 3);
                                        break;
                                case 83:
                                        appendTextToMessage('<s>' + getSelectedText()+'</s>', 3);
                                        break;
                                case 80:
                                        appendTextToMessage('_o/* <b>paf!</b> ');
                                        break;
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
                                case 66:
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
                // non traitée
        } else if(event.target.id == 'uTransforUrls') {
                // non traitée
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
                        refreshSlip();
                        return true;
                case 'uUpdate':
                        window.location = HOME_URL + 'share/minifilemanager/enhancedboard.user.js';
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
                                        leftDiv= allLeftDiv.snapshotItem(0);
                                        event.preventDefault();
                                        event.stopPropagation();
                                                document.documentElement.scrollTop=leftDiv.offsetTop-30;
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
                                appendTextToMessage(horlogeToInsert + ' pan ! pan !');
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
                        if(yPost < yScreen) {
                                showPopup = true;                                        
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
                                GlobalPopup.style.top = (60 + yScreen) + 'px';
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
                        if(yPost < yScreen) {
                                hidePopup = true;                                        
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
                window.clearInterval(GlobalRefreshTimerId);
                GlobalTimer.style.display='';

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
}

function slipProgress(event)
{
};

function slipError(event)
{
        GlobalTimer.style.display='none';
        initRefresh();
};

function slipLoaded(details)
{
        data = details.responseText;
        if(details.status == 200) {
                // parse
                var parser = new DOMParser();
                var slip = parser.parseFromString(data,"text/xml");
                var postNodes = slip.evaluate('//post[@id > ' + GlobalLastId + ']', slip, null,
                                              XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                var i = postNodes.snapshotLength;
                if(GlobalFirstLoad) {
                        while(--i >= 0 && GlobalNbLastId > 0) {
                                postNode = postNodes.snapshotItem(i);
                                currentId = postNode.getAttribute('id');
                                login = postNode.getElementsByTagName('login')[0].textContent;
                                
                                time = postNode.getAttribute('time');
                                horloge = time.substring(8);
                                horloge = horloge.substr(0,2) + ':' + horloge.substr(2,2) + ':' + horloge.substr(4,2); 
                                messageFull = postNode.getElementsByTagName('message')[0].textContent;
                                
                                info = postNode.getElementsByTagName('info')[0].textContent;
                                if(login == lastLogin && horloge == lastHorloge && messageFull == lastMessage && info == lastInfo) {
                                        GlobalNbLastId--;
                                }
                        }
                        if(i == 0 && GlobalNbLastId > 0) {
                                _log('NOT FOUND IN REMOTE.XML');
                                return null;
                        }
                        GlobalLastId = currentId;
                        GlobalFirstLoad = 0;
                }
                
                i = postNodes.snapshotLength;
                while(--i >= 0) {
                        postNode = postNodes.snapshotItem(i);
                        currentId = postNode.getAttribute('id');
                        message = postNode.getElementsByTagName('message')[0].textContent;
                        if(currentId > GlobalLastId) {
                                time = postNode.getAttribute('time');
                                hour = time.substring(8);
                                hour = hour.substr(0,2) + ':' + hour.substr(2,2) + ':' + hour.substr(4,2); 
                        
                                info = postNode.getElementsByTagName('info')[0].textContent;
                                message = postNode.getElementsByTagName('message')[0].textContent;
                                login = postNode.getElementsByTagName('login')[0].textContent;
                                
                        
                                leftDiv = document.createElement('div');
                                setClass(leftDiv,'boardleftmsg');
                                leftDiv.setAttribute('title',info);
                                leftDiv.innerHTML = '[<b>' + hour + '</b>] <a href="../~' + login + '/">' + login + '</a>';
                                
                                rightDiv = document.createElement('div');
                                setClass(rightDiv,'boardrightmsg');
                                rightDiv.innerHTML = '  <b>-</b> ' + message;
                                
                                rewriteDivs(leftDiv, rightDiv);
                                spacerDiv = document.createElement('div');
                                spacerDiv.setAttribute('style','clear: both;');
                        
                                firstDiv = evalexp('//div[@class=\'boardindex\']/div[starts-with(@class,\'boardleftmsg\')]').snapshotItem(0);
                                allDiv = evalexp('//div[@class=\'boardindex\']/div[starts-with(@class,\'boardrightmsg\')]');
                                lastDiv = allDiv.snapshotItem(allDiv.snapshotLength - 1).nextSibling;
                                
                                allLeftDivs = evalexp('//div[@class=\'boardindex\']/div[starts-with(@class,\'boardleftmsg\')]');
                                lastLeftDiv = allLeftDivs.snapshotItem(allLeftDivs.snapshotLength - 1);
                                        
                                        GlobalBoardIndex.insertBefore(spacerDiv, lastDiv.nextSibling);
                                        
                                GlobalBoardIndex.insertBefore(rightDiv, spacerDiv);
                                GlobalBoardIndex.insertBefore(leftDiv, rightDiv);
                                        
                                        GlobalBoardIndex.removeChild(firstDiv.nextSibling.nextSibling);
                                        GlobalBoardIndex.removeChild(firstDiv.nextSibling);
                                        GlobalBoardIndex.removeChild(firstDiv);
                                GlobalLastId = currentId;
                        }
                }
        } else {
                _log('http=' + details.status);
        }
        document.getElementById('refresh').style.color = 'black';
        GlobalTimer.style.display='none';
        initRefresh();
}

function postToSlip(inputField)
{
        GlobalIsFortuning = false;
        GlobalTimer.style.display='';
        addClass(inputField,'onsubmit');
        
        var formData = 'section=1&message=' + encodeURIComponent(inputField.value);

        var length = formData.length;
        var cookies = 'unique_id=' + readCookie('unique_id') + ';md5=' + readCookie('md5') + ';';
         
        var x = new XMLHttpRequest();
        function afterPost(e) {
                if (x.readyState == 4) {
                        refreshSlip();
                        s='Vous devez être identifié et avoir un karma supérieur à 2 pour poster sur la tribune.';
                        ind=x.responseText.indexOf(s);
                        empty=1;
                        if(ind !=-1 && ind < 3500) {
                                alert(s);
                                empty=0;
                        }
                        s='Désolé, mais vous ne pouvez pas saisir un nouveau message, revenez plus tard.';
                        ind=x.responseText.indexOf(s);
                        if(ind !=-1 && ind < 3500) {
                                alert(s);
                                empty=0;
                        }
                        if(empty==1) inputField.value = '';
                        GM_log(inputField.value);
                        removeClass(inputField,'onsubmit');
                }
        }
        
        x.onreadystatechange = function (e) {afterPost(e);}
        x.open('POST', postUrl, true);
        x.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
        x.setRequestHeader('Content-Lenght', length);
        x.setRequestHeader('User-Agent', GM_getValue('dlfp.ua'));
        x.send(formData);
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
                element.style.top = y + document.documentElement.scrollTop - 10 - element.clientHeight + 'px';
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

function stringToHorloge(message)
{
        var exp = /[0-2][0-9]:[0-6][0-9](:[0-6][0-9])?([¹²³]|[:\^][123456789]|[:\^]1[0123456789])?/;
        var newMessage = '';
        var tmpMessage = message;
        
        // On recherche les indices des horloges
        result = exp.exec(message);
        
        nbHorloge = 0;
        lengthToAdd = 0;
        horloges = new Array();
        horlogesIndexes = new Array();
        
        while(result && result.length > 0) {
                horloge = result[0];
                horlogeExp = horloge.replace(/\^/,'\\^');
                
                iHorloge = tmpMessage.search(horlogeExp) + lengthToAdd;
                
                horloges[nbHorloge] = horloge;
                horlogesIndexes[nbHorloge] = iHorloge;
                
                lengthToAdd += horloge.length;
                tmpMessage = tmpMessage.replace(horloge, '');
                result = exp.exec(tmpMessage);
                nbHorloge++;
        }
        
        // On remplace chaque nhorloge par son span
        lengthToAdd = 0;
        for(var j = 0; j < nbHorloge ; j++) {
                horloge = horloges[j];
                horlogeIndex = horlogesIndexes[j];
                
                idHorloge = horloge;
                horlogeClass = 'horloge';
                
                part1 = message.substring(0,horlogeIndex + lengthToAdd);
                part2 = message.substring(horlogeIndex + horloge.length + lengthToAdd);
                
                // Est ce que c'est une de mes horloge ? si oui on rajoute la classe myPost
                
                if(horloge.length == 10)  { // avec exposant long : 10:00:00^1
                        idHorloge = horloge.substr(0,8) + '' + horloge.charAt(9);
                } else if(horloge.length == 9) { // avec exposant
                        exposant = horloge.charAt(horloge.length - 1);
                        if(exposant == '¹') nb = 1;
                        else if(exposant == '²') nb = 2;
                        else if(exposant == '³') nb = 3;
                        idHorloge = horloge.substr(0,8) + nb;
                } else if(horloge.length == 5) { // ex: 10:45
                } else if(horloge.length == 8) {
                }
                
                query_my_post = '//div[contains(@id,\'' + idHorloge + '\') and contains(@class,\'myPost\')]';
                var allDivs = evalexp(query_my_post);
                if (allDivs.snapshotLength != 0 ) {
                        horlogeClass = horlogeClass + ' ' + 'myPost';
                }
                
                newPart1 = '<span class="' + horlogeClass + '" id="' + idHorloge + '">';
                newPart2 = '</span>';
                newHorloge = newPart1 + horloge + newPart2;
                lengthToAdd += newHorloge.length - horloge.length;
                message = part1 + newHorloge + part2;
        }
        return message;
}

function highlightedClick() {
        clearInterval(GlobalClickTimer);
        queryLeft = '//div[contains(@class,\'highlighted\')]';
                var allDivs = evalexp(queryLeft);
                for (var i = 0; i < allDivs.snapshotLength; i++) {
                        unhighlightPointedHorloge(allDivs.snapshotItem(i).id);
                }

        GlobalKeyModeInProgress = true;
        highlightPointedHorloge(GlobalClickId);
}

//faire clignoter le title quand la fenetre n'a pas le blur
var GlobalAlertState=0;
function postAlert() 
{
        if (GM_getValue('dlfp.clignotement')!='Inactif') {
                if (!GlobalWindowFocus) {
                        GlobalAlertState++;
                        var temp = '* '+GM_getValue('dlfp.title');
                        if (document.title == GM_getValue('dlfp.title')) {
                                temp = '* '+GM_getValue('dlfp.title');
                        } else {
                                temp = GM_getValue('dlfp.title');
                        }
                        document.title = temp ;
                        if (!GlobalAlert && GM_getValue('dlfp.clignotement')=='Clignotement') {
                                _log(GlobalAlert);
                                GlobalAlert=setInterval(postAlert,500);
                        }
                        playMarseillaise();
                } else {
                        clearInterval(GlobalAlert);
                        GlobalAlert = false;
                        GlobalAlertState=0;
                        document.title= GM_getValue('dlfp.title');
                }
        } else {
                stopMarseillaise();
                document.title= GM_getValue('dlfp.title');
        }
}

function _log(msg) {
        if (GM_getValue('dlfp.debug')==1) {
                GM_log(msg);
        }
}

function evalexp(expression) {
        return document.evaluate(expression, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
}

function getSelectedText(){
        base = document.getElementById("message");
        return base.value.substring(base.selectionStart, base.selectionEnd);
}

/* ---------------------------- SERIALIZE TOOLKIT --------------------- */
/* discuss at: http://phpjs.org/functions/serialize                         */
/* version: 812.3015
 *         original by: Arpad Ray (mailto:arpad@php.net)
 *         improved by: Dino
 *         bugfixed by: Andrej Pavlovic
 *         bugfixed by: Garagoth
 */
function serialize( mixed_value ) {
    var _getType = function( inp ) {
        var type = typeof inp, match;
        var key;
        if (type == 'object' && !inp) {
            return 'null';
        }
        if (type == "object") {
            if (!inp.constructor) {
                return 'object';
            }
            var cons = inp.constructor.toString();
            if (match = cons.match(/(\w+)\(/)) {
                cons = match[1].toLowerCase();
            }
            var types = ["boolean", "number", "string", "array"];
            for (key in types) {
                if (cons == types[key]) {
                    type = types[key];
                    break;
                }
            }
        }
        return type;
    };
    var type = _getType(mixed_value);
    var val, ktype = '';
    
    switch (type) {
        case "function": 
            val = ""; 
            break;
        case "undefined":
            val = "N";
            break;
        case "boolean":
            val = "b:" + (mixed_value ? "1" : "0");
            break;
        case "number":
            val = (Math.round(mixed_value) == mixed_value ? "i" : "d") + ":" + mixed_value;
            break;
        case "string":
            val = "s:" + mixed_value.length + ":\"" + mixed_value + "\"";
            break;
        case "array":
        case "object":
            val = "a";
            var count = 0;
            var vals = "";
            var okey;
            var key;
            for (key in mixed_value) {
                ktype = _getType(mixed_value[key]);
                if (ktype == "function") { 
                    continue; 
                }
                
                okey = (key.match(/^[0-9]+$/) ? parseInt(key) : key);
                vals += serialize(okey) +
                        serialize(mixed_value[key]);
                count++;
            }
            val += ":" + count + ":{" + vals + "}";
            break;
    }
    if (type != "object" && type != "array") val += ";";
    return val;
}
function unserialize(data){
    var error = function (type, msg, filename, line){throw new window[type](msg, filename, line);};
    var read_until = function (data, offset, stopchr){
        var buf = [];
        var chr = data.slice(offset, offset + 1);
        var i = 2;
        while(chr != stopchr){
            if((i+offset) > data.length){
                error('Error', 'Invalid');
            }
            buf.push(chr);
            chr = data.slice(offset + (i - 1),offset + i);
            i += 1;
        }
        return [buf.length, buf.join('')];
    };
    var read_chrs = function (data, offset, length){
        buf = [];
        for(var i = 0;i < length;i++){
            var chr = data.slice(offset + (i - 1),offset + i);
            buf.push(chr);
        }
        return [buf.length, buf.join('')];
    };
    var _unserialize = function (data, offset){
        if(!offset) offset = 0;
        var buf = [];
        var dtype = (data.slice(offset, offset + 1)).toLowerCase();
        
        var dataoffset = offset + 2;
        var typeconvert = new Function('x', 'return x');
        var chrs = 0;
        var datalength = 0;
        
        switch(dtype){
            case "i":
                typeconvert = new Function('x', 'return parseInt(x)');
                var readData = read_until(data, dataoffset, ';');
                var chrs = readData[0];
                var readdata = readData[1];
                dataoffset += chrs + 1;
            break;
            case "b":
                typeconvert = new Function('x', 'return (parseInt(x) == 1)');
                var readData = read_until(data, dataoffset, ';');
                var chrs = readData[0];
                var readdata = readData[1];
                dataoffset += chrs + 1;
            break;
            case "d":
                typeconvert = new Function('x', 'return parseFloat(x)');
                var readData = read_until(data, dataoffset, ';');
                var chrs = readData[0];
                var readdata = readData[1];
                dataoffset += chrs + 1;
            break;
            case "n":
                readdata = null;
            break;
            case "s":
                var ccount = read_until(data, dataoffset, ':');
                var chrs = ccount[0];
                var stringlength = ccount[1];
                dataoffset += chrs + 2;
                
                var readData = read_chrs(data, dataoffset+1, parseInt(stringlength));
                var chrs = readData[0];
                var readdata = readData[1];
                dataoffset += chrs + 2;
                if(chrs != parseInt(stringlength) && chrs != readdata.length){
                    error('SyntaxError', 'String length mismatch');
                }
            break;
            case "a":
                var readdata = new Array();
                
                var keyandchrs = read_until(data, dataoffset, ':');
                var chrs = keyandchrs[0];
                var keys = keyandchrs[1];
                dataoffset += chrs + 2;
                
                for(var i = 0;i < parseInt(keys);i++){
                    var kprops = _unserialize(data, dataoffset);
                    var kchrs = kprops[1];
                    var key = kprops[2];
                    dataoffset += kchrs;
                    
                    var vprops = _unserialize(data, dataoffset);
                    var vchrs = vprops[1];
                    var value = vprops[2];
                    dataoffset += vchrs;
                    
                    readdata[key] = value;
                }
                
                dataoffset += 1;
            break;
            default:
                error('SyntaxError', 'Unknown / Unhandled data type(s): ' + dtype);
            break;
        }
        return [dtype, dataoffset - offset, typeconvert(readdata)];
    };
    return _unserialize(data, 0)[2];
}
