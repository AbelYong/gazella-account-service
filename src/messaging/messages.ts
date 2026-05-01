import { UserRegisteredInput } from "../schemas/account_schema.js";

export class UserRegisteredMsg implements UserRegisteredInput {
    constructor(
        public readonly email: string,
        public readonly name: string,
        public readonly parentalSurname: string | undefined,
        public readonly maternalSurname: string | undefined,
        public readonly role: string,
        public readonly registratedAt: Date,
        public readonly userId: string
    ) {
        this.email = email;
        this.name = name;
        this.parentalSurname = parentalSurname;
        this.maternalSurname = maternalSurname;
        this.role = role;
        this.registratedAt = registratedAt;
        this.userId = userId
    }
}
