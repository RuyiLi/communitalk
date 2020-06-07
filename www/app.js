const $ = document.querySelector.bind(document);


// Elements
const messageForm = $('form#message-box');
const messageInp = $('input#message-box-input');
const messagesContainer = $('div#messages');
const locationHeader = $('h1#loc');
const memberCountHeader = $('h2#memberCount');
const messageTemplate = $('template#message');


// Setup
const names = [ "alligator", "anteater", "armadillo", "auroch", "axolotl", "badger", "bat", "beaver", "buffalo", "camel", "capybara", "chameleon", "cheetah", "chinchilla", "chipmunk", "chupacabra", "cormorant", "coyote", "crow", "dingo", "dinosaur", "dog", "dolphin", "dragon", "duck", "dumboOctopus", "elephant", "ferret", "fox", "frog", "giraffe", "gopher", "grizzly", "hedgehog", "hippo", "hyena", "jackal", "ibex", "ifrit", "iguana", "koala", "kraken", "lemur", "leopard", "liger", "lion", "llama", "manatee", "mink", "monkey", "narwhal", "nyan cat", "orangutan", "otter", "panda", "penguin", "platypus", "pumpkin", "python", "quagga", "rabbit", "raccoon", "rhino", "sheep", "shrew", "skunk", "slow loris", "squirrel", "tiger", "turtle", "unicorn", "walrus", "wolf", "wolverine", "wombat" ];
const animal = names[ Math.floor(Math.random() * names.length) ];
const name = 'Anonymous' + animal[ 0 ].toUpperCase() + animal.slice(1);
let loc = 'TWlzc2lzc2F1Z2E=';

locationHeader.innerText = loc = atob(loc);
messageInp.placeholder = `Message ${ loc }...`;


// DOM Events
messageForm.addEventListener('submit', function (evt) {
    evt.preventDefault();

    const { value } = messageInp;
    if (!value) return;
    messageInp.value = '';

    ws.send(JSON.stringify({
        event: 'SEND_MESSAGE',
        data: {
            content: value,
            from: name,
            systemMessage: false,
        }
    }));
});


// WS
// const ws = new WebSocket(`ws://localhost:3000/?loc=${ loc }&name=${ name }`);
const ws = new WebSocket(`wss://learned-odd-parmesan.glitch.me/?loc=${ loc }&name=${ name }`);

ws.addEventListener('open', function () {
    console.log('Established connection to websocket.');
    ws.send(JSON.stringify({
        event: 'USER_JOIN',
        data: { name },
    }))
});

ws.addEventListener('message', function ({ data: data_ }) {
    const { event, data } = JSON.parse(data_);
    if (event === 'SEND_MESSAGE') {
        if (data.systemMessage) {
            const message = document.createElement('em');
            message.innerText = data.content;
            message.classList.add('system-message');
            messagesContainer.appendChild(message);
            return;
        } else {
            const message = messageTemplate.content.cloneNode(true);
            const $m = message.querySelector.bind(message);

            if (data.from === name) {
                $m('div.message').classList.add('from-me');
                $m('em#author').innerText = 'You';
            } else {
                $m('em#author').innerText = data.from;
            }
            $m('p#content').innerText = data.content;

            messagesContainer.appendChild(message);
        }

        messagesContainer.scrollTo(0, messagesContainer.scrollHeight);

    } else if (event === 'USER_JOIN') {
        memberCountHeader.innerText = `${ data.numUsers } users online.`;

        ws.send(JSON.stringify({
            event: 'SEND_MESSAGE',
            data: {
                content: `${ data.name } has joined the conversation.`,
                systemMessage: true,
            }
        }));
    } else if (event === 'USER_LEAVE') {
        memberCountHeader.innerText = `${ data.numUsers } users online.`;

        ws.send(JSON.stringify({
            event: 'SEND_MESSAGE',
            data: {
                content: `${ data.name } has left the conversation.`,
                systemMessage: true,
            }
        }));
    }
});
