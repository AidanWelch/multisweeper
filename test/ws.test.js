const assert = require('assert');
const WebSocket = require('ws');
require('../gameserver');

class Request {
    constructor (operation, data){
        this.operation = operation;
        this.data = data;
    }
}

describe('Test of the WebSocket game server', () => {
    var ws;
    it('should connect', () => {
        ws = new WebSocket('ws://localhost:81');
    });

    it('should open', () => {
        ws.on('open', () => {
            ws.send(JSON.stringify(new Request('create', {name: 'test'})));
        });
    });

    it('should not crash on faulty schema', () => {
        ws.send("fail");
        ws.send(JSON.stringify(new Request('create', {x: 'test'})));
        ws.send(JSON.stringify(new Request('click', {y: 'test'})));
        ws.send(JSON.stringify(new Request(false, {x: 2})));
        ws.send(JSON.stringify(new Request('click', {name: 2})));
    });

    after(() => {
        process.exit();
    });
});