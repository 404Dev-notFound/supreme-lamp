/**
 * Lightweight, compliant RESP (Redis Serialization Protocol) TCP Server
 * Used for real network integration testing and multi-process distributed testing.
 * Runs on Node.js net module over standard TCP sockets (e.g., port 6389).
 */

const net = require("net");

class TestRedisServer {
  constructor(options = {}) {
    this.port = options.port || 6389;
    this.host = options.host || "127.0.0.1";
    this.password = options.password || "redispassword9555";
    this.store = new Map();
    this.ttls = new Map();
    this.server = null;
    this.connections = new Set();
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        this.connections.add(socket);
        let buffer = Buffer.alloc(0);

        socket.on("data", (chunk) => {
          buffer = Buffer.concat([buffer, chunk]);
          while (buffer.length > 0) {
            const parsed = this.parseRESP(buffer);
            if (!parsed) break; // Incomplete packet, wait for next chunk
            buffer = buffer.slice(parsed.bytesRead);
            this.handleCommand(parsed.args, socket);
          }
        });

        socket.on("close", () => {
          this.connections.delete(socket);
        });

        socket.on("error", () => {
          this.connections.delete(socket);
        });
      });

      this.server.on("error", reject);
      this.server.listen(this.port, this.host, () => {
        resolve({ host: this.host, port: this.port });
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      for (const socket of this.connections) {
        socket.destroy();
      }
      this.connections.clear();
      this.store.clear();
      this.ttls.clear();
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  parseRESP(buf) {
    if (buf.length === 0) return null;
    const firstChar = String.fromCharCode(buf[0]);

    // Format *<numArgs>\r\n$<len>\r\n<arg>\r\n...
    if (firstChar === "*") {
      const lineEnd = buf.indexOf("\r\n");
      if (lineEnd === -1) return null;
      const numArgs = parseInt(buf.slice(1, lineEnd).toString(), 10);
      let offset = lineEnd + 2;
      const args = [];

      for (let i = 0; i < numArgs; i++) {
        if (offset >= buf.length || buf[offset] !== 36) return null; // '$'
        const argLenEnd = buf.indexOf("\r\n", offset);
        if (argLenEnd === -1) return null;
        const argLen = parseInt(buf.slice(offset + 1, argLenEnd).toString(), 10);
        offset = argLenEnd + 2;
        if (offset + argLen + 2 > buf.length) return null;
        const argVal = buf.slice(offset, offset + argLen).toString();
        args.push(argVal);
        offset += argLen + 2;
      }

      return { args, bytesRead: offset };
    }

    // Inline command (e.g. PING\r\n)
    const lineEnd = buf.indexOf("\r\n");
    if (lineEnd === -1) return null;
    const line = buf.slice(0, lineEnd).toString().trim();
    const args = line.split(/\s+/);
    return { args, bytesRead: lineEnd + 2 };
  }

  handleCommand(args, socket) {
    if (!args || args.length === 0) return;
    const cmd = args[0].toUpperCase();

    // Check expiration before processing
    const now = Date.now();
    for (const [k, exp] of this.ttls.entries()) {
      if (exp <= now) {
        this.store.delete(k);
        this.ttls.delete(k);
      }
    }

    switch (cmd) {
      case "AUTH": {
        const pass = args[args.length - 1];
        if (this.password && pass !== this.password) {
          socket.write("-ERR invalid password\r\n");
        } else {
          socket.write("+OK\r\n");
        }
        break;
      }
      case "PING": {
        socket.write("+PONG\r\n");
        break;
      }
      case "CLIENT": {
        socket.write("+OK\r\n");
        break;
      }
      case "COMMAND": {
        socket.write("*0\r\n");
        break;
      }
      case "INFO": {
        const info = [
          "# Server",
          "redis_version:7.2.4-test",
          "redis_mode:standalone",
          "# Memory",
          `used_memory:${this.store.size * 64}`,
          "used_memory_human:1.2M",
          "used_memory_peak_human:1.5M",
          "# Clients",
          `connected_clients:${this.connections.size}`,
          "total_connections_received:10",
          "total_commands_processed:100",
        ].join("\r\n");
        const b = Buffer.from(info);
        socket.write(`$${b.length}\r\n${info}\r\n`);
        break;
      }
      case "GET": {
        const key = args[1];
        if (this.store.has(key)) {
          const val = this.store.get(key);
          const b = Buffer.from(val);
          socket.write(`$${b.length}\r\n${val}\r\n`);
        } else {
          socket.write("$-1\r\n");
        }
        break;
      }
      case "SET": {
        const key = args[1];
        const val = args[2];
        this.store.set(key, val);
        if (args[3] && args[3].toUpperCase() === "EX" && args[4]) {
          const seconds = parseInt(args[4], 10);
          this.ttls.set(key, Date.now() + seconds * 1000);
        }
        socket.write("+OK\r\n");
        break;
      }
      case "DEL": {
        let count = 0;
        for (let i = 1; i < args.length; i++) {
          if (this.store.delete(args[i])) count++;
          this.ttls.delete(args[i]);
        }
        socket.write(`:${count}\r\n`);
        break;
      }
      case "INCR":
      case "INCRBY": {
        const key = args[1];
        const by = cmd === "INCRBY" ? parseInt(args[2] || "1", 10) : 1;
        const current = parseInt(this.store.get(key) || "0", 10);
        const next = current + by;
        this.store.set(key, String(next));
        socket.write(`:${next}\r\n`);
        break;
      }
      case "EXPIRE": {
        const key = args[1];
        const seconds = parseInt(args[2], 10);
        if (this.store.has(key)) {
          this.ttls.set(key, Date.now() + seconds * 1000);
          socket.write(":1\r\n");
        } else {
          socket.write(":0\r\n");
        }
        break;
      }
      case "TTL": {
        const key = args[1];
        if (!this.store.has(key)) {
          socket.write(":-2\r\n");
        } else if (!this.ttls.has(key)) {
          socket.write(":-1\r\n");
        } else {
          const remMs = this.ttls.get(key) - Date.now();
          socket.write(`:${Math.max(0, Math.ceil(remMs / 1000))}\r\n`);
        }
        break;
      }
      case "SCAN": {
        const pattern = args[3] && args[2].toUpperCase() === "MATCH" ? args[3] : "*";
        const regex = new RegExp(
          "^" + pattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&").replace(/\*/g, ".*") + "$"
        );
        const matches = [];
        for (const k of this.store.keys()) {
          if (regex.test(k)) {
            matches.push(k);
          }
        }
        // Return *2 -> cursor "0" -> array of matched keys
        let resp = `*2\r\n$1\r\n0\r\n*${matches.length}\r\n`;
        for (const m of matches) {
          const mb = Buffer.from(m);
          resp += `$${mb.length}\r\n${m}\r\n`;
        }
        socket.write(resp);
        break;
      }
      case "QUIT": {
        socket.write("+OK\r\n");
        socket.end();
        break;
      }
      default: {
        socket.write("+OK\r\n");
      }
    }
  }
}

module.exports = { TestRedisServer };

