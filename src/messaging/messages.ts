import { UserRegisteredInput } from "../schemas/account_schema.js";
import { ArticlePublishedInput, ArticleRejectedInput, DraftPublishedInput } from "./article_schemas.js";

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

export class DraftPublishedMsg implements DraftPublishedInput {
    constructor(
        public readonly draftId: string,
        public readonly title: string,
        public readonly authorName: string,
        public readonly summary: string
    ) {}
}

export class ArticlePublishedMsg implements ArticlePublishedInput {
    constructor(
        public readonly articleId: string,
        public readonly authorId: string,
        public readonly title: string,
        public readonly authorName: string
    ) {}
}

export class ArticleRejectedMsg implements ArticleRejectedInput {
    constructor(
        public readonly articleId: string,
        public readonly authorId: string,
        public readonly title: string,
        public readonly authorName: string
    ) {}
}
