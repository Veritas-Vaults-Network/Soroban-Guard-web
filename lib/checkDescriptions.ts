/**
 * Plain-English descriptions for known Soroban Guard check names.
 * Used to show tooltips on check name badges in the findings table.
 */
export const checkDescriptions: Record<string, string> = {
  // Core checks (soroban-guard-core)
  'missing-require-auth':
    'A contract method writes to storage without calling env.require_auth(). Any caller can mutate state without proving authorization.',
  'unchecked-arithmetic':
    'Integer arithmetic (+, -, *) is used without checked_add/checked_sub/checked_mul. Silent overflow can corrupt token balances.',
  'unprotected-admin':
    'A privileged admin function (set_owner, upgrade, pause, etc.) has no require_auth call. Anyone can invoke it.',
  'unsafe-storage-patterns':
    'Writes to temporary storage (TTL-bound) or dynamic Symbol::new keys derived from caller input — both are collision-prone or expiry-prone.',

  // Legacy / alternative names
  'unchecked-auth':
    'Authorization is not verified before executing a privileged operation.',
  'integer-overflow':
    'Integer arithmetic may overflow or underflow without proper bounds checking.',
  'reentrancy':
    'Function may be vulnerable to reentrancy attacks via cross-contract calls before state is updated.',
  'uninitialized-variable':
    'A storage key is read without checking whether it exists first.',
  'unsafe-math':
    'Arithmetic operations lack overflow/underflow protection.',
  'missing-validation':
    'Input parameters are not validated before use.',
  'unchecked-call':
    'External function call result is not checked for success.',
  'access-control':
    'Function lacks proper access control checks.',
  'logic-error':
    'Potential logic error detected in control flow.',
  'unsafe-cast':
    'Type casting may lose precision or cause unexpected behavior.',
}
