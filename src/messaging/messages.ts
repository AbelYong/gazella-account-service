import { UserRegisteredInput } from "../schemas/account_schema.js";

export class UserRegisteredMsg implements UserRegisteredInput {
    constructor(
        public readonly email: string,
        public readonly name: string,
        public readonly parentalSurname: string,
        public readonly maternalSurname: string,
        public readonly userId: string
    ) {
        this.email = email;
        this.name = name;
        this.parentalSurname = parentalSurname;
        this.maternalSurname = maternalSurname;
        this.userId = userId
    }
}
