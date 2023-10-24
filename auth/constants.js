export const DeviceAuthStatus = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    CODE_ISSUED: 'code_issued',
    ERROR: 'error'
};

export const OAuthErrorCodes = {
    // Device Access Token Response error codes
    ACCESS_DENIED: 'access_denied',
    SLOW_DOWN: 'slow_down',
    AUTHORIZATION_PENDING: 'authorization_pending',
    EXPIRED_TOKEN: 'expired_token',
    //OAuth 2.0 Authorization Response error codes
    INVALID_CLIENT: 'invalid_client',
    INVALID_GRANT: 'invalid_grant',
    INVALID_REQUEST: 'invalid_request',
    INVALID_SCOPE: 'invalid_scope',
    UNAUTHORIZED_CLIENT: 'unauthorized_client',
    UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
}