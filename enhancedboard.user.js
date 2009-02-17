// ==UserScript==
// -*- mode: c; c-basic-offset: 8; -*-
//  * vim: noexpandtab sw=8 ts=8 sts=0:
// @name           enhancedBoard
// @namespace      http://www.linuxfr.org
// @description    Bring Web 2.0 features to LinuxFr - Version 2009.02.16
// @include        http://linuxfr.org/board
// @include        http://linuxfr.org/board/*
// @include        http://www.linuxfr.org/board
// @include        http://www.linuxfr.org/board/*
// @include        https://linuxfr.org/board
// @include        https://linuxfr.org/board/*
// @include        https://www.linuxfr.org/board
// @include        https://www.linuxfr.org/board/*
// ==/UserScript==

// Changelog : http://renardjb.googlepages.com/changelog

// Enable log
GM_setValue('dlfp.debug',0);

//--- Section "DEFINE CONST" ---
const VERSION = '2009.02.16';
const DEFAULT_UA_SMALL = 'EnhancedBoard';
const BAS_EN_HAUT = 1;
const HAUT_EN_BAS = 2;
const DEFAULT_SENS = BAS_EN_HAUT;
const DEFAULT_UA = DEFAULT_UA_SMALL + '/' + VERSION;
const DEFAULT_REVERSE = DEFAULT_SENS ;
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
const PANEL_WIDTH = 20;
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
var GlobalReverseInProgress = false;
var GlobalKeyModeInProgress = false;
// Contient le cache des totoz
var GlobalArrayTotoz = new Array();
// Contient une référence des posts du posteur
var GlobalArrayMyPosts = new Array();
// Permet de définir les personnes indésirables (séparé par '|')
var GlobalBakLogins = new Array();
// Liste de mots séparés par '|' qui transforme un post en IsBoulet
var GlobalForbiddenWords = new Array();
// Liste des transformations d'url
var GlobalsTransforUrls=[['\w*(jpg)$','IMG'],['\w*(png)$','IMG'],['^https?://(www\.)?linuxfr\.org','DLFP'],['^http://(www\.)?google\.(fr|com)','Google'],['^http://(www\.)?lemonde\.(fr|com)','Le Monde'],['^http://(www\.)?youtube','YouTube'],['^http://(www\.)?dailymotion','DailyMotion'],['^http://(www\.)?whatthemovie','wtm'],['^http://(www\.)?20minutes','20m'],['^http://(www\.)?lefigaro','fig'],
['^http://.*yahoo','Ya']
];
// Le popup des totoz
var GlobalPopup = document.createElement('div');
GlobalPopup.style.display = 'none';
GlobalPopup.setAttribute('class','popup');

var GlobalTimer = document.createElement('div');
GlobalTimer.setAttribute('class','timer');
GlobalTimer.setAttribute('id','timer');
GlobalTimer.style.display='none';

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
global_variables = ['totoz','reverse','autorefresh','timeout', 
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

// Petit hack 
if (GM_getValue('dlfp.clignotement')==true || 
    GM_getValue('dlfp.clignotement')==false) {
        GM_setValue('dlfp.clignotement','Clignotement');
}

/* ajout des events listeners */
global_events = ['load','blur','click','submit','mouseover','mouseout',
                 'mousemove','mousedown','mouseup','keyup','keydown',
                 'keypress', 'change','focus','dblclick','scroll'];
for(evt in global_events) {
        window.addEventListener(global_events[evt],
                        function(event) { manageEvent(event); }, true);
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
        addGlobalStyle(        '.main {' +
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
                        '}');

                        if (GM_getValue('dlfp.inputfixed')==true) {
                                addGlobalStyle(        '.menubar {' +
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

// transforme un post en boulet, suivant le mode
function BouletRightDivTransformator( rightDiv) {
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
	}
}

function UrlTransformator(rightDiv) {
	urls = rightDiv.getElementsByTagName('a');
        var regURL = new RegExp('^https?://(www\.)?linuxfr.org');
        for (i=0; i<urls.length;i++) {
		if (urls[i].getAttribute('href')) {
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
        	                        	regURL = new RegExp(GlobalsTransforUrls[j][0]);
                	                        if(regURL.test(urls[i].getAttribute('href'))) {
                        	                	txtURL += '<b>['+GlobalsTransforUrls[j][1]+']</b>';
                                	        	urls[i].innerHTML = (txtURL==""?'<b>[url]</b>':'<b>'+txtURL+'</b>');
							break;
        	                                }
                	                }
                        	} 
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
                GlobalArrayMyPosts[GlobalArrayMyPosts.length] = 
                        horloge + currentHorlogeNumber;
                GlobalArrayMyPosts[GlobalArrayMyPosts.length] = 
                        horloge.substring(0,5);
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
		BouletRightDivTransformator(rightDiv);
        } else {
		UrlTransformator(rightDiv);
		BigornoTransformator(rightDiv);
		
        }
}

function BigornoTransformator(rightDiv) {
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
        if(!GlobalReverseInProgress) {
                GlobalReverseInProgress = true;
                document.getElementById('sens').style.color = 'gray';
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
                
                if(sens == HAUT_EN_BAS) {
                        // On place le form juste après le div du panel 
                        // pour qu'ils soient alignés
                        GlobalBoardIndex.appendChild(form);
                        window.location = '#bottom';
                        
                } else {
                        GlobalBoardIndex.insertBefore(form, br);
                        window.location = '#top';
                }
                GlobalReverseInProgress = false;
                document.getElementById('sens').style.color = 'black';
        }
}

function reverseTribune()
{
        // On modifie la variable globale
        if(GlobalReverseInProgress) {
                return null;
        }
        sens = GM_getValue('dlfp.reverse');
        sens = (sens == HAUT_EN_BAS ? BAS_EN_HAUT : HAUT_EN_BAS);
        GM_setValue('dlfp.reverse', sens);
        reversePosts();
        rewriteInput();
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
                        break;
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
function stringToLecon(message)
{
    var exp = new RegExp('(le([cç]|&ccedil;|&Ccedil;)on\\s*([0-9]+))', 'gi');
    return message.replace(exp, '<a href="http://ridercrazy.com/divers/coursfr/lecon$3.html">$1</a>');
}

function rewriteMessage(message)
{
    // On réecrit les leçons, les totoz, les horloges, les urls et les canards
    message = stringToLecon(message);
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
        
        if(GM_getValue('dlfp.reverse') == HAUT_EN_BAS) {
                for (var i = 0; i < allLeftDivs.snapshotLength; i++) {
                        rewriteDivs(allLeftDivs.snapshotItem(i),
                                        allRightDivs.snapshotItem(i));
                }
        } else         {
                for (var i = allLeftDivs.snapshotLength - 1; i >= 0; i--) {
                        rewriteDivs(allLeftDivs.snapshotItem(i),
                                        allRightDivs.snapshotItem(i));
                }
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
                                'http://renardjb.googlepages.com/refresh_16x16.png',
                                'Allons à la pêche aux trolls'));
        expandLink.appendChild(addToolbarIcon('configZoneLink',
                                'http://renardjb.googlepages.com/Settings-16x16.png',
                                'Configuration'));
        expandLink.appendChild(addToolbarIcon('uUpdate',
                                'http://renardjb.googlepages.com/web_16x16.png',
                                'A moi les fritures'));
        
        hiddenPanel = document.createElement('table');
        hiddenPanel.setAttribute('class','subpanel');
        hiddenPanel.setAttribute('id','configZone');
        hiddenPanel.style.display = 'none';
        
        hiddenPanel.appendChild(addToolbarButton('sens','Retourner la tribune'));
        
        hiddenPanel.appendChild(addToolbarCheckBox('uautorefresh',
                                'Auto Refresh', 
                                GM_getValue('dlfp.autorefresh')));
        hiddenPanel.appendChild(addToolbarTextBox('timeoutinput',
                                'Déclencheur', 
                                GM_getValue('dlfp.timeout')/1000,3));
        hiddenPanel.appendChild(addToolbarTextBox('uainput',
                                'User-Agent', 
                                GM_getValue('dlfp.ua'),50));
        hiddenPanel.appendChild(addToolbarTextBox('uBakinput',
                                'BoitAkon', 
                                GM_getValue('dlfp.baklogins'),50));
        hiddenPanel.appendChild(addToolbarTextBox('uforbiddenWord',
                                'Mots censurés', 
                                GM_getValue('dlfp.forbiddenwords'),50));
        hiddenPanel.appendChild(addToolbarTextBox('titleinput',
                                'Titre', 
                                document.title,50));
        hiddenPanel.appendChild(addToolbarTextBox('faviconinput',
                                'Favicon', 
                                GM_getValue('dlfp.favicon'),50));
        hiddenPanel.appendChild(addToolbarCheckBox('uchasse',
                                'Chasse ouverte', 
                                GM_getValue('dlfp.chasse')));
        hiddenPanel.appendChild(addToolbarSelectBox('ubouletmode',
                                'Mode de filtrage', 
                                ['putifuto','nedflan'], 
                                GM_getValue('dlfp.antibouletmode'),50));
        hiddenPanel.appendChild(addToolbarSelectBox('utotozmode',
                                'Totoz', 
                                ['popup','inline'], 
                                GM_getValue('dlfp.totoz'),50));
        hiddenPanel.appendChild(addToolbarTextBox('utotozsrv',
                                'Serveur totoz', 
                                GM_getValue('dlfp.totozsrv'),50));
        hiddenPanel.appendChild(addToolbarSelectBox('uclignotement',
                                'Alerte',
                                ['Inactif','Simple','Clignotement'], 
                                GM_getValue('dlfp.clignotement')));
        hiddenPanel.appendChild(addToolbarCheckBox('umyalert',
                                'Alertes égoïstes', 
                                GM_getValue('dlfp.myalert')));
        hiddenPanel.appendChild(addToolbarCheckBox('uinputfixed',
                                'Formulaire fixe', 
                                GM_getValue('dlfp.inputfixed')));
        hiddenPanel.appendChild(addToolbarCheckBox('ump3',
                                'Musique', 
                                GM_getValue('dlfp.mp3')));

        hiddenPanel.innerHTML += '<tr class="subpanel">'+
                '<td style="text-align:right;color:gray;top:3px;" '+
                'class="subpanel" colspan="2">'+
                'Current version : <a href="http://renardjb.googlepages.com/">' + VERSION + '</a></td></tr>';

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

        //scp = document.createElement('script');
        //scp.setAttribute('language','javascript');
        //scp.setAttribute('src','http://scripts.url2thumb.com/thumbnails/thumbs.js?border=004891');
        //scp.setAttribute('type','text/javascript');
        //document.getElementsByTagName('body')[0].appendChild(scp);
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
        createCustomElements();
        displayPanel();
        onLoadGetMessages();
        addBottomLink();
        sens = GM_getValue('dlfp.reverse'); 
        if(sens != DEFAULT_SENS) {
                reversePosts();
        }
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
                if (GM_getValue('dlfp.reverse')==HAUT_EN_BAS) {
                        element.style.bottom='0.2em' //='96.5%';
                        document.getElementById('panel').style.top='2em';
                } else {
                        element.style.top='2.2em';
                        document.getElementById('panel').style.top='5.5em';
                }
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
                if (GM_getValue('dlfp.reverse')==HAUT_EN_BAS) {
//                        dv.style.height='2em';
                        dv.style.top='auto';
                        dv.style.bottom='0';
                        dv.style.height='1.6em';
                } else {
                        dv.style.height='2em';
                        dv.style.top='1.8em';
                }
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

                } else {
                        _log(event.keyCode);
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
                        window.location = 'http://renardjb.googlepages.com/enhancedboard.user.js';
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
                default:
        }
        switch(nodeName) {
                case 'span':
//                        'ENCOURS
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
                        }
      else if(nodeClass.indexOf('canard',0)!=-1) {
        if (target.parentNode.nodeName.toLowerCase() == 'div' && getClass(target.parentNode).match('boardrightmsg')) {
          clockId = getId(target.parentNode);
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
                        }
                        break;
                case 'button':
                        break;
                case 'a':
                        break;
                case 'b':
                        if( (target.parentNode.nodeName.toLowerCase() == 'div' && getClass(target.parentNode).match('boardleftmsg'))
                        || (target.parentNode.nodeName.toLowerCase() == 'span' && getClass(target.parentNode) == 'bigorno') ) {
                                if(target.parentNode.nodeName.toLowerCase() == 'span' && getClass(target.parentNode) == 'bigorno') {
                                        clockId = getId(target.parentNode.parentNode);
                                }
                                else {
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
//        GlobalRefreshTimerId = window.setInterval(refreshSlip,
//                                                GM_getValue('dlfp.timeout'));
};
function slipLoaded(details)
{
        data = details.responseText;
        sens = GM_getValue('dlfp.reverse');
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
                                        
                                if(GM_getValue('dlfp.reverse') == BAS_EN_HAUT) {
                                        GlobalBoardIndex.insertBefore(spacerDiv, firstDiv);
                                } else {
                                        GlobalBoardIndex.insertBefore(spacerDiv, lastDiv.nextSibling);
                                }
                                        
                                GlobalBoardIndex.insertBefore(rightDiv, spacerDiv);
                                GlobalBoardIndex.insertBefore(leftDiv, rightDiv);
                                        
                                if(GM_getValue('dlfp.reverse') == BAS_EN_HAUT) {
                                        GlobalBoardIndex.removeChild(lastLeftDiv);
                                        GlobalBoardIndex.removeChild(lastDiv.previousSibling);
                                        GlobalBoardIndex.removeChild(lastDiv);
                                } else {
                                        GlobalBoardIndex.removeChild(firstDiv.nextSibling.nextSibling);
                                        GlobalBoardIndex.removeChild(firstDiv.nextSibling);
                                        GlobalBoardIndex.removeChild(firstDiv);
                                }
                                GlobalLastId = currentId;
                        }
                }
        } else {
                _log('http=' + details.status);
        }
        document.getElementById('sens').style.color = 'black';
        document.getElementById('refresh').style.color = 'black';
        GlobalTimer.style.display='none';
        initRefresh();
        //GlobalRefreshTimerId = window.setInterval(refreshSlip,
        //                                        GM_getValue('dlfp.timeout'));
}

function postToSlip(inputField)
{
        GlobalIsFortuning = false;
        GlobalTimer.style.display='';
        addClass(inputField,'onsubmit');
        
        var formData = 'section=1&message=' + encodeURIComponent(inputField.value);

        var length = formData.length;
        var cookies = 'unique_id=' + readCookie('unique_id') + ';md5=' + readCookie('md5') + ';';
        
        function afterPost(e, inputField) {
                refreshSlip();
                s='Vous devez être identifié et avoir un karma supérieur à 2 pour poster sur la tribune.';
                ind=e.responseText.indexOf(s);
                empty=1;
                if(ind !=-1 && ind < 3500) {
                        alert(s);
                        empty=0;
                }
                s='Désolé, mais vous ne pouvez pas saisir un nouveau message, revenez plus tard.';
                ind=e.responseText.indexOf(s);
                if(ind !=-1 && ind < 3500) {
                        alert(s);
                        empty=0;
                }
                if(e.status == 200) {
                        if(empty==1) inputField.value = '';
                        removeClass(inputField,'onsubmit');
                }
        }
        
        GM_xmlhttpRequest( {
                method:'POST',
                url:postUrl,
                headers:{
                        'Content-Type':'application/x-www-form-urlencoded',
                        'Content-Lenght': length,
                        'User-agent': GM_getValue('dlfp.ua'),
                        'Cookie': cookies
                        },
                data:formData,
                onload:function (e){afterPost(e, inputField);}
        });
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
                
                if(GlobalArrayMyPosts.contains(idHorloge) || GlobalArrayMyPosts.contains(idHorloge + '1')) {
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
