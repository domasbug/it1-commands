# it1-commands

A small Node.js library for communicating with **Systec IT1** weight indicators over a serial (RS-232) connection. It automatically frames all commands in <…> per the IT1 protocol, handles CR+LF-terminated responses, and translates both normal data (weight readings, I/O status) and two-digit error codes into human-readable output.

---

## Installation

```bash
npm install it1-commands
```

or with Yarn:

```bash
yarn add it1-commands
```

## Usage

```js
const { Scale, COMMANDS, ERROR_CODES } = require('it1-commands');

(async () => {
  // 1. Create and open the scale on your serial port
  const scale = new Scale({ port: 'COM3', baudRate: 9600 });
  await scale.open();

  // 2. Listen for responses, error codes, and port events
  scale.on('response', text => {
    console.log('Response:', text);
  });

  scale.on('errorCode', (code, description) => {
    console.error(`Error ${code}: ${description}`);
  });

  scale.on('portError', err => {
    console.error('Serial port error:', err.message);
  });

  scale.on('closed', () => {
    console.log('Port closed');
  });

  scale.on('restarted', () => {
    console.log('Port reopened (autoRestart)');
  });

  scale.on('sent', (cmd, param) => {
    console.log(`Sent command: ${cmd}${param}`);
  });

  // 3. Send a command (e.g. Read Weight, no-motion)
  scale.send('RN');

  // 4. (optional) Close the port manually when done
  // await scale.close();
})();
```

## API

### Class: `Scale`

#### Constructor

```ts
new Scale(options: {
  port: string;           // e.g. 'COM3' or '/dev/ttyUSB0'
  baudRate?: number;      // default: 9600
  autoRestart?: boolean;  // default: false
});
```

* **`port`** – Serial port path.
* **`baudRate`** – Port speed (must match indicator).
* **`autoRestart`** – If `true`, automatically reopens the port after it closes.

#### Methods

* **`open(): Promise<void>`**
  Opens the serial port.

* **`close(): Promise<void>`**
  Closes the serial port.

* **`send(cmd: string, param?: string): void`**
  Send a framed command `<CMDparam>` to the indicator. Throws if `cmd` is unknown.

### Events

You can subscribe via `scale.on(eventName, callback)`.

| Event       | Args                           | Description                                    |
| ----------- | ------------------------------ | ---------------------------------------------- |
| `response`  | `(text: string)`               | Normal data response (e.g. weight, I/O status) |
| `errorCode` | `(code: string, desc: string)` | Two-digit IT1 error code and its meaning       |
| `portError` | `(err: Error)`                 | Serial port errors                             |
| `closed`    | `()`                           | Emitted when port closes                       |
| `restarted` | `()`                           | Emitted after auto-reopen (if enabled)         |
| `sent`      | `(cmd: string, param: string)` | Emitted after a command is written             |

### Constants

* **`COMMANDS`** – Object mapping command codes to descriptions. Use for reference.

* **`ERROR_CODES`** – Mapping of two‑digit error codes to human-friendly messages.

## Commands Reference

```js
console.table(COMMANDS);
```

| Code | Description             |
| ---- | ----------------------- |
| RN   | Read Weight (no motion) |
| RM   | Read Weight (in motion) |
| TA   | Automatic Tare          |
| TM   | Manual Tare             |
| TC   | Clear Tare              |
| SZ   | Set Scale To Zero       |
| ST   | Set date and Time       |
| SP   | Set SetPoints           |
| GI   | Get digital Input       |
| OS   | Set digital Output      |
| OC   | Clear digital Outputs   |
| DC   | Set background color    |
| LK   | Lock keyboard           |

````js
## Error Codes

console.table(ERROR_CODES);
````

Descriptive mapping of IT1 indicator error codes.

---

## Demo

We include a runnable demo script in `examples/demo.js`:

```bash
npm run demo
```

It will:

1. Open `COM3` (modify in demo script as needed)
2. Send the “Read Weight” command (`RN`)
3. Log the response or error

---

*Published as [it1-commands on npm](https://www.npmjs.com/package/it1-commands).*
