const { SerialPort }      = require('serialport');
const { DelimiterParser } = require('@serialport/parser-delimiter');

const COMMANDS = {
  RN: 'Read Weight (no motion)',
  RM: 'Read Weight (in motion)',
  TA: 'Automatic Tare',
  TM: 'Manual Tare',
  TC: 'Clear Tare',
  SZ: 'Set Scale To Zero',
  ST: 'Set date and Time',
  SP: 'Set SetPoints',
  GI: 'Get digital Input',
  OS: 'Set digital Output',
  OC: 'Clear digital Outputs',
  DC: 'Set background color',
  LK: 'Lock keyboard',
};

const ERROR_CODES = {
  '00': 'No error',
  '11': 'General scale error (e.g. no connection to load cell)',
  '12': 'Scale overload (maximum weighing range exceeded)',
  '13': 'Scale in motion (not settled after 6 seconds)',
  '15': 'Error taring or zero setting (wrong format or not in zero range)',
  '20': 'Scale in underload',
  '31': 'Transmission error (data string too long or timeout)',
  '32': 'Invalid command',
  '33': 'Invalid parameter',
  '39': 'Keyboard cannot be unlocked (locked via digital input)',
};

class Scale {
  /**
   * Create a Scale instance.
   * @param {Object} options
   * @param {string} options.port - Serial port path (e.g., 'COM3' or '/dev/ttyUSB0').
   * @param {number} [options.baudRate=9600] - Baud rate for the serial connection.
   * @param {boolean} [options.autoRestart=false] - Automatically reopen the port after it closes.
   */
  constructor({ port, baudRate = 9600, autoRestart = false }) {
    this.autoRestart = autoRestart;
    this.port = new SerialPort({ path: port, baudRate, autoOpen: false });
    this.parser = this.port.pipe(new DelimiterParser({ delimiter: Buffer.from([0x0D, 0x0A]) }));
    this._listeners = {};
    this._attachEvents();
  }

  /**
   * Internal: attach event listeners to parser and port.
   * @private
   */
  _attachEvents() {
    this.parser.on('data', (chunk) => {
      const text = chunk.toString('ascii').trim();
      if (/^\d{2}$/.test(text) && ERROR_CODES[text]) {
        this.emit('errorCode', text, ERROR_CODES[text]);
      } else {
        this.emit('response', text);
      }
    });

    this.port.on('error', (err) => this.emit('portError', err));

    this.port.on('close', () => {
      this.emit('closed');
      if (this.autoRestart) {
        setTimeout(() => {
          this.open()
            .then(() => this.emit('restarted'))
            .catch((err) => this.emit('portError', err));
        }, 100);
      }
    });
  }

  /**
   * Register an event listener.
   * @param {string} event - Event name ('response', 'errorCode', 'portError', 'closed', 'restarted', 'sent').
   * @param {Function} listener - Callback invoked when the event occurs.
   */
  on(event, listener) {
    (this._listeners[event] ||= []).push(listener);
  }

  /**
   * Emit an event to all registered listeners.
   * @param {string} event - Event name.
   * @param {...any} args - Arguments passed to the listener callbacks.
   * @private
   */
  emit(event, ...args) {
    (this._listeners[event] || []).forEach((fn) => fn(...args));
  }

  /**
   * Open the serial port.
   * @returns {Promise<void>} Resolves when the port is open.
   */
  open() {
    return new Promise((resolve, reject) => {
      this.port.open((err) => (err ? reject(err) : resolve()));
    });
  }

  /**
   * Close the serial port.
   * @returns {Promise<void>} Resolves when the port is closed.
   */
  close() {
    return new Promise((resolve, reject) => {
      this.port.close((err) => (err ? reject(err) : resolve()));
    });
  }

  /**
   * Send a command to the scale.
   * @param {string} cmd - Two-letter command code (e.g., 'RN' or 'SZ').
   * @param {string} [param='1'] - Optional parameter string for the command.
   * @throws {Error} If the command code is unknown.
   */
  send(cmd, param = '1') {
    if (!COMMANDS[cmd]) {
      throw new Error(`Unknown command: ${cmd}`);
    }
    const framed = `<${cmd}${param}>`;
    const buf = Buffer.from(framed, 'ascii');
    this.port.write(buf, (err) => {
      if (err) this.emit('portError', err);
      else     this.emit('sent', cmd, param);
    });
  }
}

module.exports = { Scale, COMMANDS, ERROR_CODES };
