$(function () {
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // Initialize variables
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $users = $('.users'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box

    var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page

    // Prompt for setting a username
    var username;
    var authenticated = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();

    var socket = io();


    const updateParticipantsMessage = (data, options) => {
        var message = '';
        if (data.users.length === 1) {
            message += "there's 1 participant";
        } else {
            message += "there are " + data.users.length + " participants";
        }
        log(message);
        $users.empty();
        data.users.forEach(function (user) {
            addUserPresence(user, options);
        });


    }

    // Sets the client's username
    const setUsername = () => {
        username = cleanInput($usernameInput.val().trim());

        // If the username is valid
        if (username) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();

            // Tell the server your username
            // Authenticate
            socket.emit('authenticate', {"appname": "master", "username": username});

        }
    }

    // Sends a chat message
    const sendMessage = () => {
        var message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && authenticated) {
            $inputMessage.val('');
            addChatMessage({
                username: username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('message', {"appname": "master", "message": message});
            socket.emit('message', {"appname": "app1", "message": message});
            socket.emit('message', {"appname": "app2", "message": message});
        }
    }

    // Log a message
    const log = (message, options) => {
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    const addChatMessage = (data, options) => {
        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUsernameColor(data.username));
        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    // Adds the visual user to the user list
    const addUserPresence = (presence, options) => {

        console.log(presence);

        var $userId = $('<span class="socketId"/>')
            .text('[' + presence.meta.socketId + '] ');
        var $usernameDiv = $('<span class="username"/>')
            .text(presence.meta.username)
            .css('color', getUsernameColor(presence.meta.username));
        var $presenceDiv = $('<span class="presence"/>')
            .text((presence.idle) ? 'idle' : 'online')
            .css('color', getUsernameColor(presence.meta.username));

        var $userDiv = $('<li  class="user"/>')
            .data('socketId', presence.meta.socketId)
            .data('username', presence.meta.username)
            .append($userId, $usernameDiv, $presenceDiv);

        addUserElement($userDiv, options);
    }


    // Adds the visual chat typing message
    const addChatTyping = (data) => {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }

    // Removes the visual chat typing message
    const removeChatTyping = (data) => {
        getTypingMessages(data).fadeOut(() => {
            $(this).remove();
        });
    }

    const removeUserElement = (data) => {
        $('.user').each(function (index) {
            //console.log( index + ": " + $( this ).data('id') );
            if ($(this).data('socketId') === data.socketId) {
                console.log('removing user from ui : ' + data.username);
                $(this).fadeOut(() => {
                    $(this).remove();
                });

            }
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    const addMessageElement = (el, options) => {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    const addUserElement = (el, options) => {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $users.prepend($el);
        } else {
            $users.append($el);
        }
        //$users[0].scrollTop = $users[0].scrollHeight;
    }

    // Prevents input from having injected markup
    const cleanInput = (input) => {
        return $('<div/>').text(input).html();
    }

    // Updates the typing event
    const updateTyping = () => {

        if (!typing) {
            typing = true;
            socket.emit('typing');
        }
        lastTypingTime = (new Date()).getTime();

        setTimeout(() => {
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                socket.emit('stop typing');
                typing = false;
            }
        }, TYPING_TIMER_LENGTH);

    }

    // Gets the 'X is typing' messages of a user
    const getTypingMessages = (data) => {
        return $('.typing.message').filter(i => {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through our hash function
    const getUsernameColor = (username) => {
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Keyboard events

    $window.keydown(event => {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                setUsername();
            }
        }
    });

    $inputMessage.on('input', () => {
        updateTyping();
    });

    // Click events

    // Focus input when clicking anywhere on login page
    $loginPage.click(() => {
        $currentInput.focus();
    });

    // Focus input when clicking on the message input's border
    $inputMessage.click(() => {
        $inputMessage.focus();
    });

    // Socket events

    // socket.on('presence', (data) => {
    // console.log('on presence');
    //     data.users.forEach(function (connectedUser) {
    //         console.log(JSON.stringify(connectedUser));
    //         $('.user').each(function (index) {
    //             $(this).remove();
    //         });
    //         addUserPresence({id: connectedUser.meta.socketId, username: connectedUser.meta.username});
    //     });
    //
    // });


    // Whenever the server emits 'login', log the login message
    socket.on('authenticated', (data) => {

        authenticated = data.authenticated;

        // Display the welcome message
        var message = "Welcome to Realtime Chat! ";
        log(message, {
            prepend: true
        });
        updateParticipantsMessage(data, {});
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('message', (data) => {
        addChatMessage(data);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', (data) => {
        log(data.username + ' joined');
        updateParticipantsMessage(data);

    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', (data) => {
        log(data.username + ' left');
        updateParticipantsMessage(data);
        removeChatTyping(data);
        removeUserElement(data);
    });

    // Whenever the server emits 'typing', show the typing message
    socket.on('typing', (data) => {
        console.log('on typing');
        addChatTyping(data);
    });

    // Whenever the server emits 'stop typing', kill the typing message
    socket.on('stop typing', (data) => {
        console.log('on stop typing');
        removeChatTyping(data);
    });

    socket.on('disconnect', () => {
        log('you have been disconnected');
    });

    socket.on('reconnect', () => {
        log('you have been reconnected');
        if (username) {
            socket.emit('adduser', username);
        }
    });

    socket.on('reconnect_error', () => {
        log('attempt to reconnect has failed');
    });

});
