// A short Soroban contract with intentional vulnerabilities for demo purposes.
// Vulnerabilities:
//   1. Integer overflow: unchecked arithmetic on u32 balance
//   2. Missing authorization: anyone can call withdraw()
//   3. Unprotected admin setter: set_admin has no auth check

export const SAMPLE_CONTRACT = `#![no_std]
use soroban_sdk::{contract, contractimpl, contractstorage, symbol_short, Address, Env};

#[contract]
pub struct VulnerableVault;

#[contractimpl]
impl VulnerableVault {
    /// Deposit tokens — balance can silently overflow (u32 wraps around)
    pub fn deposit(env: Env, user: Address, amount: u32) {
        let key = symbol_short!("bal");
        let current: u32 = env.storage().instance().get(&key).unwrap_or(0);
        // BUG: unchecked addition — wraps on overflow instead of panicking
        env.storage().instance().set(&key, &(current + amount));
    }

    /// Withdraw tokens — no authorization check, anyone can drain the vault
    pub fn withdraw(env: Env, amount: u32) {
        let key = symbol_short!("bal");
        let current: u32 = env.storage().instance().get(&key).unwrap_or(0);
        // BUG: no caller.require_auth() — any account can withdraw
        let new_bal = current.checked_sub(amount).expect("insufficient funds");
        env.storage().instance().set(&key, &new_bal);
    }

    /// Change admin — no auth guard, anyone can become admin
    pub fn set_admin(env: Env, new_admin: Address) {
        // BUG: missing new_admin.require_auth() or existing admin check
        env.storage().instance().set(&symbol_short!("admin"), &new_admin);
    }

    pub fn balance(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("bal")).unwrap_or(0)
    }
}
`
