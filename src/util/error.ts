
export class DbError extends Error {
    constructor(cause: Error, message: string) {
        super(message);
        this.cause = cause;

        Error.captureStackTrace(this, this.constructor);
    }
}
