# it1-commands

A small Node.js library for communicating with Systec IT1 weight indicators over a serial (RS-232) connection. It automatically frames all commands in <…> per the IT1 protocol, handles CR+LF-terminated responses, and translates both normal data (weight readings, I/O status) and two-digit error codes into human-readable output.

## Installation

```bash
npm install it1-commands
