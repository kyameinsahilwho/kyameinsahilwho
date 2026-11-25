//! TEMPLATE from Platter src/cleanup.rs: detect "elevated as a different account than the desktop user"
//! (over-the-shoulder UAC credentials, Windows 11 Administrator protection). When true, %LOCALAPPDATA%,
//! %TEMP%, %USERPROFILE% and HKCU belong to the admin, not the signed-in user: refuse per-user writes.
//! Needs windows-sys Win32_Foundation, Win32_Security, Win32_System_Threading, Win32_UI_WindowsAndMessaging.

use crate::util::is_elevated;

/// The user SID of a token, kept in its TOKEN_USER buffer.
struct TokenSid(Vec<u64>);

impl TokenSid {
    fn of_process(process: windows_sys::Win32::Foundation::HANDLE) -> Option<TokenSid> {
        use windows_sys::Win32::Foundation::CloseHandle;
        use windows_sys::Win32::Security::{GetTokenInformation, TokenUser, TOKEN_QUERY};
        use windows_sys::Win32::System::Threading::OpenProcessToken;
        let mut tok = std::ptr::null_mut();
        if unsafe { OpenProcessToken(process, TOKEN_QUERY, &mut tok) } == 0 {
            return None;
        }
        let mut buf = vec![0u64; 64];
        let mut len = 0u32;
        let ok = unsafe { GetTokenInformation(tok, TokenUser, buf.as_mut_ptr() as *mut _, (buf.len() * 8) as u32, &mut len) };
        unsafe { CloseHandle(tok) };
        (ok != 0).then_some(TokenSid(buf))
    }

    fn same_as(&self, other: &TokenSid) -> bool {
        use windows_sys::Win32::Security::{EqualSid, TOKEN_USER};
        unsafe {
            let a = (*(self.0.as_ptr() as *const TOKEN_USER)).User.Sid;
            let b = (*(other.0.as_ptr() as *const TOKEN_USER)).User.Sid;
            EqualSid(a, b) != 0
        }
    }
}

/// True when the app runs elevated as a different account than the one that owns the desktop
/// (over-the-shoulder UAC). When that can't be confirmed either way while elevated, it says true,
/// so per-user items are left alone rather than cleaning someone else's profile.
pub(crate) fn other_account() -> bool {
    use windows_sys::Win32::Foundation::CloseHandle;
    use windows_sys::Win32::System::Threading::{GetCurrentProcess, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION};
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetShellWindow, GetWindowThreadProcessId};
    if !is_elevated() {
        return false;
    }
    let Some(me) = TokenSid::of_process(unsafe { GetCurrentProcess() }) else { return true };
    let shell = unsafe { GetShellWindow() };
    if shell.is_null() {
        return true;
    }
    let mut pid = 0u32;
    unsafe { GetWindowThreadProcessId(shell, &mut pid) };
    if pid == 0 {
        return true;
    }
    let hp = unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid) };
    if hp.is_null() {
        return true;
    }
    let desktop_user = TokenSid::of_process(hp);
    unsafe { CloseHandle(hp) };
    match desktop_user {
        Some(u) => !u.same_as(&me),
        None => true,
    }
}

