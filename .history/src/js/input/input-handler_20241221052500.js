class InputHandler {
    constructor(socket) {
        this.socket = socket;
        this.isControlling = false;
        this.scaleFactor = { x: 1, y: 1 };
    }

    startControl() {
        this.isControlling = true;
        this._setupEventListeners();
    }

    stopControl() {
        this.isControlling = false;
        this._removeEventListeners();
    }

    _setupEventListeners() {
        const screen = document.getElementById('remote-screen');
        screen.addEventListener('mousedown', this._handleMouseEvent.bind(this));
        screen.addEventListener('mousemove', this._handleMouseEvent.bind(this));
        screen.addEventListener('mouseup', this._handleMouseEvent.bind(this));
        document.addEventListener('keydown', this._handleKeyEvent.bind(this));
        document.addEventListener('keyup', this._handleKeyEvent.bind(this));
    }

    _removeEventListeners() {
        const screen = document.getElementById('remote-screen');
        screen.removeEventListener('mousedown', this._handleMouseEvent.bind(this));
        screen.removeEventListener('mousemove', this._handleMouseEvent.bind(this));
        screen.removeEventListener('mouseup', this._handleMouseEvent.bind(this));
        document.removeEventListener('keydown', this._handleKeyEvent.bind(this));
        document.removeEventListener('keyup', this._handleKeyEvent.bind(this));
    }

    _handleMouseEvent(event) {
        if (!this.isControlling) return;

        const screen = document.getElementById('remote-screen');
        const rect = screen.getBoundingClientRect();
        
        // Calculate relative position within the video element
        const x = (event.clientX - rect.left) * this.scaleFactor.x;
        const y = (event.clientY - rect.top) * this.scaleFactor.y;

        this.socket.emit('input-event', {
            type: 'touch',
            action: event.type,
            x: Math.round(x),
            y: Math.round(y)
        });
    }

    _handleKeyEvent(event) {
        if (!this.isControlling) return;

        this.socket.emit('input-event', {
            type: 'key',
            keyCode: event.keyCode,
            action: event.type
        });
    }

    updateScaleFactor(deviceWidth, deviceHeight) {
        const screen = document.getElementById('remote-screen');
        this.scaleFactor = {
            x: deviceWidth / screen.offsetWidth,
            y: deviceHeight / screen.offsetHeight
        };
    }
}