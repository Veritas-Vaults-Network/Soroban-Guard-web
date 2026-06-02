/**
 * Plain-English descriptions for known Soroban Guard check names.
 * Used to show tooltips on check name badges in the findings table.
 */
export const checkDescriptions: Record<string, string> = {
  // Authorization
  'missing-require-auth':
    'A contract method writes to storage without calling env.require_auth(). Any caller can mutate state without proving authorization.',
  'unprotected-admin':
    'A privileged admin function (set_owner, upgrade, pause, etc.) has no require_auth call. Anyone can invoke it.',
  'unchecked-auth':
    'Authorization is not verified before executing a privileged operation.',
  'missing-auth-check':
    'A sensitive operation is performed without verifying the caller identity via require_auth or require_auth_for_args.',
  'auth-bypass':
    'Authorization check can be bypassed due to incorrect condition logic or missing guard on a code path.',

  // Arithmetic
  'unchecked-arithmetic':
    'Integer arithmetic (+, -, *) is used without checked_add/checked_sub/checked_mul. Silent overflow can corrupt token balances.',
  'integer-overflow':
    'Integer arithmetic may overflow or underflow without proper bounds checking.',
  'unsafe-math':
    'Arithmetic operations lack overflow/underflow protection.',
  'division-by-zero':
    'A division operation does not guard against a zero divisor, which would cause a runtime panic.',
  'precision-loss':
    'Fixed-point or integer division discards fractional bits, leading to rounding errors that accumulate over time.',

  // Storage
  'unsafe-storage-patterns':
    'Writes to temporary storage (TTL-bound) or dynamic Symbol::new keys derived from caller input — both are collision-prone or expiry-prone.',
  'uninitialized-variable':
    'A storage key is read without checking whether it exists first.',
  'storage-collision':
    'Two different logical values share the same storage key, causing one to silently overwrite the other.',
  'missing-ttl-extension':
    'Persistent or instance storage entries are written but their TTL is never extended, risking premature expiry.',
  'unbounded-storage-growth':
    'A map or vector in contract storage grows without a size cap, enabling a denial-of-service via storage exhaustion.',

  // Reentrancy & cross-contract calls
  'reentrancy':
    'Function may be vulnerable to reentrancy attacks via cross-contract calls before state is updated.',
  'unchecked-call':
    'External function call result is not checked for success.',
  'unsafe-cross-contract-call':
    'A cross-contract invocation is made before internal state is finalized, enabling reentrancy or inconsistent state.',
  'missing-return-value-check':
    'The return value of an external call is ignored; errors are silently swallowed.',

  // Access control
  'access-control':
    'Function lacks proper access control checks.',
  'missing-owner-check':
    'An administrative action does not verify that the caller is the designated contract owner.',
  'role-escalation':
    'A user can assign themselves a higher-privilege role without authorization.',

  // Input validation
  'missing-validation':
    'Input parameters are not validated before use.',
  'unchecked-input':
    'User-supplied data is used directly without range, type, or sanity checks.',
  'zero-address':
    'A zero/default address is accepted where a valid account address is required.',
  'negative-amount':
    'A token amount or quantity is not checked to be positive, allowing zero or negative transfers.',

  // Logic errors
  'logic-error':
    'Potential logic error detected in control flow.',
  'incorrect-condition':
    'A conditional expression uses the wrong operator or operands, inverting or short-circuiting intended behavior.',
  'off-by-one':
    'A loop bound or index calculation is off by one, causing under- or over-processing of elements.',
  'unreachable-code':
    'A code path can never be executed due to a preceding unconditional return or contradictory condition.',

  // Type safety
  'unsafe-cast':
    'Type casting may lose precision or cause unexpected behavior.',
  'type-confusion':
    'A value is interpreted as a different type than intended, leading to incorrect computations or panics.',

  // Denial of service
  'unbounded-loop':
    'A loop iterates over caller-controlled data without a bound, enabling a denial-of-service via excessive gas consumption.',
  'panic-on-error':
    'An unhandled panic or unwrap() call can halt contract execution and lock funds.',

  // Upgrade & admin
  'unsafe-upgrade':
    'The contract upgrade function does not enforce authorization or migration guards, allowing arbitrary code replacement.',
  'missing-migration-guard':
    'A storage schema change is applied without a version check, risking data corruption on upgrade.',

  // Events & observability
  'missing-event':
    'A state-changing operation does not emit an event, making off-chain indexing and auditing impossible.',

  // Cryptography
  'weak-randomness':
    'Randomness is derived from predictable on-chain values (ledger sequence, timestamp), making it manipulable by validators.',
  'hardcoded-secret':
    'A secret key, seed, or credential is embedded directly in contract source code.',
}
