import { Router } from "express"
import { getAccountById, getMyAccount, updateAccount } from "./controller/account_controller.js";
import { followAccount, unfollowAccount, getFollowers } from "./controller/social_controller.js";
import { asyncHandler } from "./handlers/async_handler.js";
import { AccountParamsSchema, UpdateAccountSchema } from "./schemas/account_schema.js";
import { TargetAccountSchema } from "./schemas/social_schema.js";
import { requireAuth } from "./validators/auth_validator.js";
import { validateParams, validateBody } from "./validators/request_validator.js";

const router = Router();

/**
 * @openapi
 * /accounts/me:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Get current user account
 *     description: Retrieves the account details of the currently authenticated user based on the JWT bearer token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the authenticated user's account details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "79c515bd-9ef2-4f19-bf5a-23e65cbfad8b"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "example@mail.com"
 *                 pfpUri:
 *                   type: string
 *                   nullable: true
 *                   example: "https://example.com/profiles/avatar.jpg"
 *                 name:
 *                   type: string
 *                   example: "Juan"
 *                 parentalSurname:
 *                   type: string
 *                   nullable: true
 *                   example: "Lopez"
 *                 maternalSurname:
 *                   type: string
 *                   nullable: true
 *                   example: "Garcia"
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 role:
 *                   type: string
 *                   example: "volunteer"
 *                 joinedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-04-30T18:55:10.644Z"
 *       401:
 *         description: Unauthorized. Token is invalid or the subject (sub) is missing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid Token or subject is missing (sub)"
 *                 code:
 *                   type: string
 *                   example: "MISSING_SUB"
 *       404:
 *         description: Account not found for the provided token subject.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No account matching for 79c515bd-9ef2-4f19-bf5a-23e65cbfad8b was found"
 */
router.get("/accounts/me", requireAuth, asyncHandler(getMyAccount));

/**
* @openapi
* /accounts/{id}:
*   get:
*     tags:
*       - Accounts
*     summary: Returns the profile of the user matching the id parameter
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: string
*           format: uuid
*     responses:
*       200:
*         description: Returns the profile of the user matching 
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 id:
*                   type: string
*                   format: uuid
*                   example: "79c515bd-9ef2-4f19-bf5a-23e65cbfad8b"
*                 pfpUri:
*                   type: string
*                   nullable: true
*                 name:
*                   type: string
*                   example: "Juan"
*                 parentalSurname:
*                   type: string
*                   nullable: true
*                   example: "Hernandez"
*                 maternalSurname:
*                   type: string
*                   nullable: true
*                   example: "Garcia"
*                 bio:
*                   type: string
*                   nullable: true
*                   example: "Apasionado de la vida silvestre especializado en..."
*                 role:
*                   type: string
*                   example: volunteer
*                 joinedAt:
*                   type: date-time
*                   example: 2026-04-30T18:55:10.644Z
*       400:
*         description: Returned if the provided id param is not an uuidv4
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 error: 
*                   type: string
*                 details:
*                   type: string
*       404:
*         description: Returned if the provided id doesn't match any user's id
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*/
router.get("/accounts/:id", validateParams(AccountParamsSchema), asyncHandler(getAccountById));

/**
 * @openapi
 * /accounts:
 *   patch:
 *     tags:
 *       - Accounts
 *     summary: Updates the requester's profile
 *     description: Updates the profile of the authenticated user's account matching the sub of the provided JWT
 *     security:
 *       - bearerAuth: [] 
 *     requestBody: 
 *       description: The fields of the profile to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 32
 *                 description: "Aa-Zz + áéíóúÁÉÍÓÚñÑ (max 1 space between words)"
 *               pfpUri:
 *                 type: string
 *                 maxLength: 256
 *                 format: uri
 *               parentalSurname:
 *                 type: string
 *                 maxLength: 32
 *                 description: "Aa-Zz + áéíóúÁÉÍÓÚñÑ (max 1 space between words)"
 *               maternalSurname:
 *                 type: string
 *                 maxLength: 32
 *                 description: "Aa-Zz + áéíóúÁÉÍÓÚñÑ (max 1 space between words)"
 *               bio:
 *                 type: string
 *                 maxLength: 512
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: Returned if the update was completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request. There's a problem with the request's body or it has no content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 *                   example: Invalid Input
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "name"  
 *                       message:
 *                         type: string
 *                         example: "Numbers, symbols and contiguous blank spaces are not allowed"
 *       401:
 *         description: Unauthorized - Invalid JWT or missing sub
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *                   example: "MISSING_SUB"
 *       404:
 *         description: Not Found - No account matches the JWT sub
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string                   
 */
router.patch("/accounts", requireAuth, validateBody(UpdateAccountSchema), asyncHandler(updateAccount));

/**
 * @openapi
 * /socials:
 *   post:
 *     tags:
 *       - Socials
 *     summary: Follow a user account
 *     description: Creates a follow relationship where the authenticated user follows a target user.
 *     security:
 *       - bearerAuth: [] 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetId
 *             properties:
 *               targetId:
 *                 type: string
 *                 format: uuid
 *                 description: The UUIDv4 of the account to follow.
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       201:
 *         description: Successfully followed the target account.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You are now following user 123e4567-e89b-12d3-a456-426614174000"
 *       200:
 *         description: The authenticated user is already following the target account.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You are already following this user"
 *       400:
 *         description: Bad request, the UUIDv4 is invalid or you are attempting to follow yourself.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You cannot follow yourself"
 *                 code:
 *                   type: string
 *                   example: "INVALID_TARGET"
 *       401:
 *         description: Unauthorized. Token is invalid or the subject (sub) is missing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid Token or subject is missing (sub)"
 *                 code:
 *                   type: string
 *                   example: "MISSING_SUB"
 */
router.post("/socials", requireAuth, validateBody(TargetAccountSchema), asyncHandler(followAccount));

/**
 * @openapi
 * /socials/{targetId}:
 *   delete:
 *     tags:
 *       - Socials
 *     summary: Unfollow a user account
 *     description: Removes a follow relationship where the authenticated user unfollows a target user.
 *     security:
 *       - bearerAuth: [] 
 *     parameters:
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUIDv4 of the account to unfollow.
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Successfully unfollowed the target account, or the user was not following them in the first place.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You are no longer following user 123e4567-e89b-12d3-a456-426614174000"
 *       400:
 *         description: Bad request, the UUIDv4 in params is invalid (errors) or you are attempting to unfollow yourself.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Operation not applicable"
 *                 code:
 *                   type: string
 *                   example: "INVALID_TARGET"
 *       401:
 *         description: Unauthorized. Token is invalid or the subject (sub) is missing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid Token or subject is missing (sub)"
 *                 code:
 *                   type: string
 *                   example: "MISSING_SUB"
 */
router.delete("/socials/:targetId", requireAuth, validateParams(TargetAccountSchema), asyncHandler(unfollowAccount));

/**
 * @openapi
 * /socials/followers/{id}:
 *   get:
 *     tags:
 *       - Socials
 *     summary: Get followers of an account
 *     description: Retrieves a list of users that are following the specified account.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUIDv4 of the account whose followers are being requested.
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of followers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   follower:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "987fcdeb-51a2-43d7-9012-345678901234"
 *                       pfpUri:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/profiles/avatar.jpg"
 *                       name:
 *                         type: string
 *                         example: "Juan"
 *                       parentalSurname:
 *                         type: string
 *                         nullable: true
 *                         example: "García"
 *                       maternalSurname:
 *                         type: string
 *                         nullable: true
 *                         example: "López"
 *                       role:
 *                         type: string
 *                         example: "volunteer"
 *       400:
 *         description: Bad request. The provided ID in the path is not a valid UUIDv4.
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 error: 
*                   type: string
*                   example: Invalid Input
*                 details:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       field:
*                         type: string
*                         example: id  
*                       message:
*                         type: string
*                         example: Invalid UUID
*                       
 */
router.get("/socials/followers/:id", validateParams(AccountParamsSchema), asyncHandler(getFollowers));

export default router;
