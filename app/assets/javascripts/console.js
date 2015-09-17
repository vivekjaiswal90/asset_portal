/**
 * Licensed to Neo Technology under one or more contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership. Neo Technology licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You
 * may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

'use strict';

function CypherConsole(config, ready) {

    var $IFRAME = $('<iframe/>').attr('id', 'console').addClass('cypherdoc-console');
    var $IFRAME_WRAPPER = $('<div/>').attr('id', 'console-wrapper');
    var RESIZE_OUT_ICON = 'glyphicon glyphicon-resize-full';
    var RESIZE_IN_ICON = 'glyphicon glyphicon-resize-small';
    var $RESIZE_BUTTON = $('<a class="btn btn-sm btn-primary resize-toggle"><i class="' + RESIZE_OUT_ICON + '"></i></a>');
    var $RESIZE_VERTICAL_BUTTON = $('<span class="resize-vertical-handle ui-resizable-handle ui-resizable-s"><span/></span>');
    var $PLAY_BUTTON = $('<a class="run-query btn btn-sm btn-default btn-success" data-toggle="tooltip" title="Execute in the console." href="#"><i class="glyphicon glyphicon-play"></i></a>');
    var $EDIT_BUTTON = $('<a class="edit-query btn btn-sm btn-default" data-toggle="tooltip" title="Edit in the console." href="#"><i class="glyphicon glyphicon-edit"></i></a>');
    var $TOGGLE_CONSOLE_HIDE_BUTTON = $('<a class="btn btn-sm btn-default show-console-toggle" data-toggle="tooltip"  title="Show or hide a Neo4j Console in order to try the examples in the GraphGist live."><i class="glyphicon glyphicon-pencil"></i> Show/Hide Live Console</a>');

    var $resizeOverlay = $('<div id="resize-overlay"/>');

    var consolr;
    var consoleClass = 'consoleClass' in config ? config.consoleClass : 'console';
    var contentId = 'contentId' in config ? config.contentId : 'content';
    var contentMoveSelector = 'contentMoveSelector' in config ? config.contentMoveSelector : 'div.navbar';
    var consoleUrl = config.url;

    createConsole(ready, consoleClass, contentId);

    function createConsole(ready, elementClass, contentId) {
        if ($('code.language-cypher').length > 0) {
            var $element = $('p.' + elementClass).first();
            if ($element.length !== 1) {
                //no console defined in the document
                $element = $('<p/>').addClass(elementClass);
                $('#' + contentId).append($element);
                $element.hide();
            }
            $element.each(function () {
                var $context = $(this);
                addConsole($context, ready)
            });
            addPlayButtons();
        } else {
            ready();
        }
    }

    function addConsole($context, ready) {
        var url = getUrl('none', 'none', '\n\nUse the play/edit buttons to run the queries!');
        var $iframe = $IFRAME.clone().attr('src', url);
        $iframe.load(function () {
            var iframeWindow = $iframe[0].contentWindow;
            if (!iframeWindow) {
                return;
            }
            consolr = new Consolr(iframeWindow);
            if (ready) {
                ready(consolr);
            }
            window.setTimeout(function () {
                try {
                    if (iframeWindow.location && iframeWindow.location.href) {
                        var consoleLocation = iframeWindow.location.href;
                        if (consoleLocation.indexOf('neo4j') === -1 && consoleLocation.indexOf('localhost') === -1) {
                            $iframe.replaceWith('<div class="alert alert-error"><h4>Error!</h4>The console can not be loaded. Please turn off ad blockers and reload the page!</div>');
                        }
                    }
                } catch (err) {
                    // for debugging only
                    // console.log(err)
                }
            }, 2000);
        });
        $context.empty();
        var $iframeWrapper = $IFRAME_WRAPPER.clone();
        $iframeWrapper.append($iframe);
        var $contentMoveSelector = $(contentMoveSelector).first();
        $context.append($iframeWrapper).append('<span id="console-label" class="label">Console expanded</span>');
        $context.css('background', 'none');
        var $verticalResizeButton = $RESIZE_VERTICAL_BUTTON.clone().appendTo($iframeWrapper).mousedown(function (event) {
            event.preventDefault();
        });
        $iframeWrapper.resizable({'handles': {'s': $verticalResizeButton}, 'alsoResize': $context, 'minHeight': 80, 'start': function () {
                $resizeOverlay.appendTo($iframeWrapper);
            }, 'stop': function (event, ui) {
                $resizeOverlay.detach();
            }, 'resize': function (event, ui) {
                if (!$resizeIcon.hasClass(RESIZE_OUT_ICON)) {
                    $contentMoveSelector.css('margin-top', ui.size.height + 11);
                }
            }}
        );
        var $gistForm = $('#gist-form');
        var contextHeight = 0;
        var $resizeButton = $RESIZE_BUTTON.clone().appendTo($iframeWrapper).click(function () {
            if ($resizeIcon.hasClass(RESIZE_OUT_ICON)) {
                contextHeight = $context.height();
                $context.height(36);
                $resizeIcon.removeClass(RESIZE_OUT_ICON).addClass(RESIZE_IN_ICON);
                $iframeWrapper.addClass('fixed-console');
                $context.addClass('fixed-console');
                $contentMoveSelector.css('margin-top', $iframeWrapper.height() + 11);
                $iframeWrapper.resizable('option', 'alsoResize', null);
                $gistForm.css('margin-right', 56);
            } else {
                $context.height($iframeWrapper.height());
                $resizeIcon.removeClass(RESIZE_IN_ICON).addClass(RESIZE_OUT_ICON);
                $iframeWrapper.removeClass('fixed-console');
                $context.removeClass('fixed-console');
                $contentMoveSelector.css('margin-top', 0);
                $iframeWrapper.resizable('option', 'alsoResize', $context);
                $gistForm.css('margin-right', 0);
            }
        });
        var $resizeIcon = $('i', $resizeButton);

        var $toggleConsoleShowButton = $TOGGLE_CONSOLE_HIDE_BUTTON;
        $toggleConsoleShowButton.insertAfter($context);
        if (!$context.is(':visible')) {
            $toggleConsoleShowButton.addClass('btn-success show-console-toggle-hidden-console');
        }
        $toggleConsoleShowButton.click(function () {
            if ($context.is(':visible')) {
                if (!$resizeIcon.hasClass(RESIZE_OUT_ICON)) {
                    $resizeButton.click();
                }
                $context.hide();
                $toggleConsoleShowButton.addClass('show-console-toggle-hidden-console');
            } else {
                $context.show();
                $toggleConsoleShowButton.removeClass('show-console-toggle-hidden-console');
            }
        });
    }

    function addPlayButtons() {
        $('div.query-wrapper').parent().append($PLAY_BUTTON.clone().click(function (event) {
            event.preventDefault();
            consolr.query([ getQueryFromButton(this) ]);
        })).append($EDIT_BUTTON.clone().click(function (event) {
            event.preventDefault();
            consolr.input(getQueryFromButton(this));
        }));
    }

    function getQueryFromButton(button) {
        return $(button).prevAll('div.query-wrapper').first().data('query');
    }

    function getUrl(database, command, message, session) {
        var url = consoleUrl;

        if (session !== undefined) {
            url += ';jsessionid=' + session;
        }
        url += '?';
        if (database !== undefined) {
            url += 'init=' + encodeURIComponent(database);
        }
        if (command !== undefined) {
            url += '&query=' + encodeURIComponent(command);
        }
        if (message !== undefined) {
            url += '&message=' + encodeURIComponent(message);
        }
        if (window.neo4jVersion != undefined) {
            url += '&version=' + encodeURIComponent(neo4jVersion);
        }
        return url + '&no_root=true';
    }
}

function Consolr(consoleWindow) {
    window.addEventListener('message', receiver, false);
    var receivers = [];

    function init(params, success, error, data) {
        var index = 0;
        if (success || error) {
            receivers.push(new ResultReceiver(success, error));
            index = receivers.length;
        }
        consoleWindow.postMessage(JSON.stringify({
            'action': 'init',
            'data': params,
            'call_id': index
        }), "*");
    }

    function query(queries, success, error) {
        var index = 0;
        if (success || error) {
            receivers.push(new ResultReceiver(success, error, queries.length));
            index = receivers.length;
        }
        var message = JSON.stringify({
            'action': 'query',
            'data': queries,
            'call_id': index
        });
        consoleWindow.postMessage(message, '*');
    }

    function input(query) {
        consoleWindow.postMessage(JSON.stringify({
            'action': 'input',
            'data': [ query ]
        }), '*');
    }

    function receiver(event) {
        var origin = event.origin;
        if (typeof origin !== 'string') {
            return;
        }
        if (origin.indexOf('neo4j') === -1 && origin.indexOf('localhost') === -1) {
            return;
        }
        var result = JSON.parse(event.data);
        if ('call_id' in result) {
            var rr = receivers[result.call_id - 1];
            rr(result);
        }
    }

    function ResultReceiver(successFunc, errorFunc, numberOfResults) {
        var expectedResults = numberOfResults || 1;

        function call(result) {
            if (expectedResults === 0) {
                console.log('Unexpected result', result);
                return;
            }
            expectedResults--;
            var resultNo = numberOfResults - expectedResults - 1;
            return result.error ? errorFunc(result, resultNo) : successFunc(result, resultNo);
        }

        return call;
    }

    return {
        'init': init,
        'query': query,
        'input': input
    };
}
