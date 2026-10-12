/**
 * Post-install / post-upgrade hook: connect the More Cheese demo Dropbox.
 *
 * The internal half of the demo corpus (memos, decks, spreadsheets, email threads under
 * vault/internal) lives in a Dropbox team space the More Cheese team runs. Reading it takes a
 * read-only Dropbox app key, secret and refresh token that people get from the More Cheese
 * team. Those values can never be in the repo or a release migration: GitHub strips published
 * Dropbox tokens and Dropbox revokes them, and anything encrypted at release time is
 * encrypted with the wrong key for every other install (issue #110).
 *
 * So the app ships the content source but not the credential or storage account. This hook,
 * named in mj-app.json (hooks.postInstallModule / postUpgradeModule), creates them on the
 * install itself, through the entity layer, so the credential is encrypted with that
 * install's own key:
 *
 *   - Values come from MORECHEESE_DROPBOX_APP_KEY / _APP_SECRET / _REFRESH_TOKEN
 *     (and optional _TEAM_MEMBER_ID), or, in an interactive install, from prompts.
 *   - With no values the hook does nothing: the app works, Knowledge Hub just has no
 *     Dropbox source until someone connects it.
 *   - It never throws. A failure here must not fail the app install, so it warns instead.
 *
 * The records use the IDs the release seeds used before #110, so the app's teardown still
 * removes them on uninstall.
 */
import { RunView, type IMetadataProvider, type IRunViewProvider, type UserInfo } from '@memberjunction/core';
import type {
    MJCredentialEntity,
    MJFileStorageAccountEntity,
    MJFileStorageAccountPermissionEntity,
} from '@memberjunction/core-entities';

/** Fixed record IDs, kept from the pre-#110 seeds so teardown (migrations-teardown/V001) still finds them. */
export const DROPBOX_CREDENTIAL_ID = '7A1E4C2B-5D3F-4E8A-9B6C-2F0D8E1A3C55';
export const DROPBOX_STORAGE_ACCOUNT_ID = '636E204B-12CB-4D67-A861-09DA9C825BA3';
const PERMISSION_IDS: Record<'UI' | 'Developer', string> = {
    UI: '79A45295-2080-56FD-93A4-D995CA5382E7',
    Developer: '0ADD75FF-B902-55D7-81AB-DC6535E81749',
};

/** Environment variables a non-interactive install can set to connect Dropbox. */
export const DROPBOX_ENV = {
    AppKey: 'MORECHEESE_DROPBOX_APP_KEY',
    AppSecret: 'MORECHEESE_DROPBOX_APP_SECRET',
    RefreshToken: 'MORECHEESE_DROPBOX_REFRESH_TOKEN',
    TeamMemberId: 'MORECHEESE_DROPBOX_TEAM_MEMBER_ID',
} as const;

const HOOK_PHASE = 'More Cheese';

/**
 * The parts of the Open App engine's hook payload this hook uses. Structurally compatible with
 * `AppHookPayload` from @memberjunction/open-app-engine, declared here so the server package
 * does not depend on the engine.
 */
export interface MoreCheeseHookPayload {
    Provider: unknown;
    ContextUser: unknown;
    Callbacks?: {
        OnLog?: (message: string) => void;
        OnWarn?: (phase: string, message: string) => void;
        OnSuccess?: (phase: string, message: string) => void;
        OnPromptInput?: (message: string, opts?: { default?: string }) => Promise<string>;
        OnPromptConfirm?: (message: string, opts?: { default?: boolean }) => Promise<boolean>;
        OnPromptPassword?: (message: string) => Promise<string>;
    };
}

/** The values stored in the credential, shaped by the "Dropbox OAuth" credential type's FieldSchema. */
export interface DropboxCredentialValues {
    appKey: string;
    appSecret: string;
    refreshToken: string;
    selectUser?: string;
}

/** Read the values from the environment; `null` unless all three required ones are set. */
export function ReadDropboxValuesFromEnv(env: NodeJS.ProcessEnv): DropboxCredentialValues | null {
    const appKey = env[DROPBOX_ENV.AppKey]?.trim();
    const appSecret = env[DROPBOX_ENV.AppSecret]?.trim();
    const refreshToken = env[DROPBOX_ENV.RefreshToken]?.trim();
    if (!appKey || !appSecret || !refreshToken) return null;
    const selectUser = env[DROPBOX_ENV.TeamMemberId]?.trim();
    return selectUser ? { appKey, appSecret, refreshToken, selectUser } : { appKey, appSecret, refreshToken };
}

/** Ask for the values in an interactive install; `null` when the user declines or prompts are unavailable. */
async function promptForDropboxValues(callbacks: MoreCheeseHookPayload['Callbacks']): Promise<DropboxCredentialValues | null> {
    if (!callbacks?.OnPromptConfirm || !callbacks.OnPromptInput || !callbacks.OnPromptPassword) return null;
    const connect = await callbacks.OnPromptConfirm(
        'Connect the More Cheese demo Dropbox now? You need the read-only Dropbox key from the More Cheese team. ' +
            'Skip it and the app still works; Knowledge Hub just has no Dropbox source.',
        { default: false }
    );
    if (!connect) return null;
    const appKey = (await callbacks.OnPromptInput('Dropbox app key:')).trim();
    const appSecret = (await callbacks.OnPromptPassword('Dropbox app secret:')).trim();
    const refreshToken = (await callbacks.OnPromptPassword('Dropbox refresh token:')).trim();
    const selectUser = (await callbacks.OnPromptInput('Dropbox team member id (optional, press Enter to skip):', { default: '' })).trim();
    if (!appKey || !appSecret || !refreshToken) return null;
    return selectUser ? { appKey, appSecret, refreshToken, selectUser } : { appKey, appSecret, refreshToken };
}

/** ID of the first row of `entityName` matching `filter`, or throws naming what is missing. */
async function lookupId(provider: IRunViewProvider, user: UserInfo, entityName: string, filter: string): Promise<string> {
    const result = await new RunView(provider).RunView<{ ID: string }>(
        { EntityName: entityName, ExtraFilter: filter, Fields: ['ID'], ResultType: 'simple' },
        user
    );
    if (!result.Success || result.Results.length === 0) {
        throw new Error(`no ${entityName} row matches ${filter}${result.ErrorMessage ? ` (${result.ErrorMessage})` : ''}`);
    }
    return result.Results[0].ID;
}

/** The row with this ID, if it exists. A query rather than Load(), which logs an error for a missing row. */
async function findById<R extends { ID: string }>(
    provider: IRunViewProvider,
    user: UserInfo,
    entityName: string,
    id: string,
    fields: (keyof R & string)[]
): Promise<R | null> {
    const result = await new RunView(provider).RunView<R>(
        { EntityName: entityName, ExtraFilter: `ID='${id}'`, Fields: ['ID', ...fields], ResultType: 'simple' },
        user
    );
    return result.Success && result.Results.length > 0 ? result.Results[0] : null;
}

/** Load a record by ID, or start a new one with that ID. */
async function loadOrNew<T extends MJCredentialEntity | MJFileStorageAccountEntity | MJFileStorageAccountPermissionEntity>(
    provider: IMetadataProvider & IRunViewProvider,
    user: UserInfo,
    entityName: string,
    id: string
): Promise<T> {
    const entity = await provider.GetEntityObject<T>(entityName, user);
    if ((await findById(provider, user, entityName, id, [])) && (await entity.Load(id))) return entity;
    entity.NewRecord();
    entity.ID = id;
    return entity;
}

async function save(entity: MJCredentialEntity | MJFileStorageAccountEntity | MJFileStorageAccountPermissionEntity, what: string): Promise<void> {
    if (!(await entity.Save())) {
        throw new Error(`could not save the ${what}: ${entity.LatestResult?.CompleteMessage ?? 'no detail'}`);
    }
}

/** Create or update the credential, storage account and its read permissions. */
export async function ConnectDropbox(
    provider: IMetadataProvider & IRunViewProvider,
    user: UserInfo,
    values: DropboxCredentialValues
): Promise<void> {
    const credentialTypeId = await lookupId(provider, user, 'MJ: Credential Types', `Name='Dropbox OAuth'`);
    const categoryId = await lookupId(provider, user, 'MJ: Credential Categories', `Name='Cloud Storage'`);
    const dropboxProviderId = await lookupId(provider, user, 'MJ: File Storage Providers', `Name='Dropbox'`);

    const credential = await loadOrNew<MJCredentialEntity>(provider, user, 'MJ: Credentials', DROPBOX_CREDENTIAL_ID);
    credential.CredentialTypeID = credentialTypeId;
    credential.CategoryID = categoryId;
    credential.Name = 'Dropbox OAuth';
    credential.Description = 'Read-only access to the More Cheese demo Dropbox (vault/internal). Set up by the More Cheese install hook.';
    credential.Values = JSON.stringify(values);
    credential.IsDefault = false;
    credential.IsActive = true;
    credential.IconClass = 'fa-brands fa-dropbox';
    await save(credential, 'Dropbox credential');

    const account = await loadOrNew<MJFileStorageAccountEntity>(provider, user, 'MJ: File Storage Accounts', DROPBOX_STORAGE_ACCOUNT_ID);
    account.Name = 'More Cheese Dropbox';
    account.Description = 'Dropbox Business team space, folder More Cheese/vault/internal (read-only).';
    account.ProviderID = dropboxProviderId;
    account.CredentialID = credential.ID;
    account.IncludeInGlobalSearch = true;
    await save(account, 'Dropbox storage account');

    for (const [roleName, permissionId] of Object.entries(PERMISSION_IDS)) {
        const roleId = await lookupId(provider, user, 'MJ: Roles', `Name='${roleName}'`);
        const permission = await loadOrNew<MJFileStorageAccountPermissionEntity>(
            provider,
            user,
            'MJ: File Storage Account Permissions',
            permissionId
        );
        permission.FileStorageAccountID = account.ID;
        permission.Type = 'Role';
        permission.RoleID = roleId;
        permission.CanRead = true;
        permission.CanWrite = false;
        await save(permission, `${roleName} read permission`);
    }
}

/** Whether the credential already exists and is active, i.e. Dropbox is already connected. */
async function isAlreadyConnected(provider: IRunViewProvider, user: UserInfo): Promise<boolean> {
    const row = await findById<{ ID: string; IsActive: boolean }>(provider, user, 'MJ: Credentials', DROPBOX_CREDENTIAL_ID, ['IsActive']);
    return row?.IsActive === true;
}

/** The hook entry point the Open App engine calls after install and after upgrade. */
export default async function SetUpMoreCheeseDropbox(payload: MoreCheeseHookPayload): Promise<void> {
    const callbacks = payload.Callbacks;
    try {
        const provider = payload.Provider as IMetadataProvider & IRunViewProvider;
        const user = payload.ContextUser as UserInfo;

        if (await isAlreadyConnected(provider, user)) {
            callbacks?.OnLog?.('More Cheese demo Dropbox is already connected.');
            return;
        }

        const values = ReadDropboxValuesFromEnv(process.env) ?? (await promptForDropboxValues(callbacks));
        if (!values) {
            callbacks?.OnLog?.(
                'More Cheese demo Dropbox not connected. To connect it later, follow "Connecting the demo Dropbox" ' +
                    `in the More Cheese README, or set ${DROPBOX_ENV.AppKey}, ${DROPBOX_ENV.AppSecret} and ` +
                    `${DROPBOX_ENV.RefreshToken} before the next More Cheese upgrade.`
            );
            return;
        }

        await ConnectDropbox(provider, user, values);
        callbacks?.OnSuccess?.(HOOK_PHASE, 'Connected the More Cheese demo Dropbox (credential encrypted with this install\'s key).');
    } catch (err) {
        callbacks?.OnWarn?.(
            HOOK_PHASE,
            `Could not connect the More Cheese demo Dropbox: ${err instanceof Error ? err.message : String(err)}. ` +
                'The app is installed; connect Dropbox later as described in the README.'
        );
    }
}
