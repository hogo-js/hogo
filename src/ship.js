/**
 * Ship - The Response Object
 * Represents the vessel carrying data in the Hogo framework
 * Provides deliver(), json(), and text() methods for responding
 */

export class Ship {
  constructor(res) {
    this.res = res;
    this.headersSent = false;
    this.statusCode = 200;
    this._responseData = null;
    this._contentType = null;
  }

  /**
   * Set response status code (fluent interface)
   */
  status(code) {
    if (!this.headersSent) {
      this.statusCode = code;
    }
    return this;
  }

  /**
   * Set a response header (fluent interface)
   */
  header(name, value) {
    if (!this.headersSent) {
      this.res.setHeader(name, value);
    }
    return this;
  }

  /**
   * Deliver raw data with custom content-type
   */
  deliver(data, contentType = 'application/octet-stream') {
    if (this.headersSent) {
      console.error('[Hogo] Headers already sent');
      return;
    }

    this._responseData = data;
    this._contentType = contentType;

    this.res.writeHead(this.statusCode, {
      'Content-Type': contentType,
    });

    if (typeof data === 'string') {
      this.res.end(data);
    } else if (Buffer.isBuffer(data)) {
      this.res.end(data);
    } else {
      this.res.end(String(data));
    }

    this.headersSent = true;
    return data;
  }

  /**
   * Send JSON response
   */
  json(data) {
    if (this.headersSent) {
      console.error('[Hogo] Headers already sent');
      return;
    }

    this._responseData = data;
    this._contentType = 'application/json; charset=utf-8';

    const payload = JSON.stringify(data);

    this.res.writeHead(this.statusCode, {
      'Content-Type': this._contentType,
      'Content-Length': Buffer.byteLength(payload),
    });

    this.res.end(payload);
    this.headersSent = true;
    return data;
  }

  /**
   * Send plain text response
   */
  text(data) {
    if (this.headersSent) {
      console.error('[Hogo] Headers already sent');
      return;
    }

    this._responseData = data;
    this._contentType = 'text/plain; charset=utf-8';

    const payload = String(data);

    this.res.writeHead(this.statusCode, {
      'Content-Type': this._contentType,
      'Content-Length': Buffer.byteLength(payload),
    });

    this.res.end(payload);
    this.headersSent = true;
    return data;
  }

  /**
   * Send HTML response
   */
  html(data) {
    if (this.headersSent) {
      console.error('[Hogo] Headers already sent');
      return;
    }

    this._responseData = data;
    this._contentType = 'text/html; charset=utf-8';

    const payload = String(data);

    this.res.writeHead(this.statusCode, {
      'Content-Type': this._contentType,
      'Content-Length': Buffer.byteLength(payload),
    });

    this.res.end(payload);
    this.headersSent = true;
    return data;
  }

  /**
   * Send error response
   */
  error(message, code = 500) {
    if (this.headersSent) {
      console.error('[Hogo] Headers already sent');
      return;
    }

    const errorData = {
      error: message,
      status: code,
      timestamp: new Date().toISOString(),
    };

    this._responseData = errorData;
    this._contentType = 'application/json; charset=utf-8';

    const payload = JSON.stringify(errorData);

    this.res.writeHead(code, {
      'Content-Type': this._contentType,
      'Content-Length': Buffer.byteLength(payload),
    });

    this.res.end(payload);
    this.headersSent = true;
    return errorData;
  }

  /**
   * Check if headers have already been sent
   */
  isHeadersSent() {
    return this.headersSent;
  }

  /**
   * Get response context for coalescing
   */
  getResponseContext() {
    return {
      data: this._responseData,
      contentType: this._contentType,
      statusCode: this.statusCode
    };
  }
}

export default Ship;
