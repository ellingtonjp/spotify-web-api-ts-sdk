import AccessTokenHelpers from "./AccessTokenHelpers.js";
import { emptyAccessToken } from "./IAuthStrategy.js";
export default class ImplicitGrantStrategy {
    clientId;
    redirectUri;
    scopes;
    static cacheKey = "spotify-sdk:ImplicitGrantStrategy:token";
    configuration = null;
    get cache() { return this.configuration.cachingStrategy; }
    constructor(clientId, redirectUri, scopes) {
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.scopes = scopes;
    }
    setConfiguration(configuration) {
        this.configuration = configuration;
    }
    async getOrCreateAccessToken() {
        const token = await this.cache.getOrCreate(ImplicitGrantStrategy.cacheKey, async () => {
            const token = await this.redirectOrVerifyToken();
            return AccessTokenHelpers.toCachable(token);
        }, async (expiring) => {
            return AccessTokenHelpers.refreshCachedAccessToken(this.clientId, expiring);
        });
        return token;
    }
    async getAccessToken() {
        const token = await this.cache.get(ImplicitGrantStrategy.cacheKey);
        return token;
    }
    removeAccessToken() {
        this.cache.remove(ImplicitGrantStrategy.cacheKey);
    }
    async redirectOrVerifyToken() {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        if (accessToken) {
            return Promise.resolve({
                access_token: accessToken,
                token_type: hashParams.get("token_type") ?? "",
                expires_in: parseInt(hashParams.get("expires_in") ?? "0"),
                refresh_token: hashParams.get("refresh_token") ?? "",
                expires: Number(hashParams.get("expires")) || 0
            });
        }
        const scopes = this.scopes ?? [];
        var scope = scopes.join(' ');
        const params = new URLSearchParams();
        params.append("client_id", this.clientId);
        params.append("response_type", "token");
        params.append("redirect_uri", this.redirectUri);
        params.append("scope", scope);
        const authUrl = 'https://accounts.spotify.com/authorize?' + params.toString();
        this.configuration.redirectionStrategy.redirect(authUrl);
        return emptyAccessToken;
    }
}
//# sourceMappingURL=ImplicitGrantStrategy.js.map