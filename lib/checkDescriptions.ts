export const checkDescriptions: Record<string, string> = {
  'unchecked-auth': 'Authorization is not verified before executing privileged operations.',
  'integer-overflow': 'Integer arithmetic may overflow or underflow without proper bounds checking.',
  'reentrancy': 'Function may be vulnerable to reentrancy attacks from external calls.',
  'uninitialized-variable': 'Variable is used before being initialized.',
  'unsafe-math': 'Arithmetic operations lack overflow/underflow protection.',
  'missing-validation': 'Input parameters are not validated before use.',
  'unchecked-call': 'External function call result is not checked for success.',
  'access-control': 'Function lacks proper access control checks.',
  'logic-error': 'Potential logic error detected in control flow.',
  'unsafe-cast': 'Type casting may lose precision or cause unexpected behavior.',
}
