class Coordenadas {
    constructor() {
        this._x = 0;
        this._y = 0;
        this._observers = [];
    }

    addObserver(func) {
        this._observers.push(func);
    }

    set x(value) {
        this._x = value;
        this._notifyObservers();
    }

    set y(value) {
        this._y = value;
        this._notifyObservers();
    }

    _notifyObservers() {
        for (let func of this._observers) {
            func(this._x, this._y);
        }
    }
}

module.exports = Coordenadas;


