import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/browser";

/**
 * Starts the WebAuthn passkey registration process in the browser.
 *
 * @param {PublicKeyCredentialCreationOptionsJSON} options - The registration options from the server.
 * @param {boolean} [useAutoRegister] - Whether to use browser auto-registration if supported.
 * @returns {Promise<RegistrationResponseJSON>} The registration response from the browser.
 */
export async function registerPasskey(
  options: PublicKeyCredentialCreationOptionsJSON,
  useAutoRegister?: boolean
): Promise<RegistrationResponseJSON> {
  return await startRegistration({
    optionsJSON: options,
    useAutoRegister,
  });
}

/**
 * Starts the WebAuthn passkey authentication process in the browser.
 *
 * @param {PublicKeyCredentialRequestOptionsJSON} options - The authentication options from the server.
 * @param {boolean} [useBrowserAutofill] - Whether to use browser autofill for credentials.
 * @param {boolean} [verifyBrowserAutofillInput] - Whether to verify autofill input.
 * @returns {Promise<AuthenticationResponseJSON>} The authentication response from the browser.
 */
export async function authenticatePasskey(
  options: PublicKeyCredentialRequestOptionsJSON,
  useBrowserAutofill?: boolean,
  verifyBrowserAutofillInput?: boolean
): Promise<AuthenticationResponseJSON> {
  return await startAuthentication({
    optionsJSON: options,
    useBrowserAutofill,
    verifyBrowserAutofillInput,
  });
}
